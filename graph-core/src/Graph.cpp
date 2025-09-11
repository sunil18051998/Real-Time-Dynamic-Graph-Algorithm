#include "Graph.h"
#include <sstream>
#include <queue>
#include <algorithm>

Graph::Graph() {}

bool Graph::add_node(NodeId id) {
  std::unique_lock lock(graph_mutex_);
  if (adj_.count(id)) return false;
  adj_[id] = {};
  community_of_[id] = 0;
  return true;
}

bool Graph::remove_node(NodeId id) {
  std::unique_lock lock(graph_mutex_);
  if (!adj_.count(id)) return false;
  remove_all_incident_edges(id);
  adj_.erase(id);
  community_of_.erase(id);
  return true;
}

void Graph::remove_all_incident_edges(NodeId id) {
  adj_.erase(id);
  for (auto &kv : adj_) {
    auto &vec = kv.second;
    vec.erase(std::remove_if(vec.begin(), vec.end(),
                [&](const Edge &e){ return e.to == id; }), vec.end());
  }
}

bool Graph::add_edge(NodeId u, NodeId v, Weight w) {
  std::unique_lock lock(graph_mutex_);
  if (!adj_.count(u)) add_node(u);
  if (!adj_.count(v)) add_node(v);

  auto &vu = adj_[u];
  for (auto &e : vu) if (e.to == v) { e.w = w; return false; }
  vu.push_back({v,w});

  auto &vv = adj_[v];
  for (auto &e : vv) if (e.to == u) { e.w = w; return false; }
  vv.push_back({u,w});
  return true;
}

bool Graph::remove_edge(NodeId u, NodeId v) {
  std::unique_lock lock(graph_mutex_);
  if (!adj_.count(u) || !adj_.count(v)) return false;
  auto &vu = adj_[u];
  vu.erase(std::remove_if(vu.begin(), vu.end(), [&](auto &e){return e.to==v;}), vu.end());
  auto &vv = adj_[v];
  vv.erase(std::remove_if(vv.begin(), vv.end(), [&](auto &e){return e.to==u;}), vv.end());
  return true;
}

bool Graph::has_node(NodeId id) const {
  std::shared_lock lock(graph_mutex_);
  return adj_.count(id) > 0;
}

std::vector<Edge> Graph::neighbors(NodeId id) const {
  std::shared_lock lock(graph_mutex_);
  if (!adj_.count(id)) return {};
  return adj_.at(id);
}

std::optional<int> Graph::get_community(NodeId id) const {
  std::shared_lock lock(graph_mutex_);
  if (!community_of_.count(id)) return std::nullopt;
  return community_of_.at(id);
}

std::vector<NodeId> Graph::shortest_path_bfs(NodeId src, NodeId dst) const {
  std::shared_lock lock(graph_mutex_);
  if (!adj_.count(src) || !adj_.count(dst)) return {};
  std::queue<NodeId> q;
  std::unordered_map<NodeId, NodeId> parent;
  std::unordered_set<NodeId> visited;
  q.push(src);
  visited.insert(src);
  bool found = false;
  while (!q.empty()) {
    auto cur = q.front(); q.pop();
    if (cur == dst) { found = true; break; }
    for (const auto &e : adj_.at(cur)) {
      if (!visited.count(e.to)) {
        visited.insert(e.to);
        parent[e.to] = cur;
        q.push(e.to);
      }
    }
  }
  if (!found) return {};
  std::vector<NodeId> path;
  NodeId cur = dst;
  while (cur != src) {
    path.push_back(cur);
    cur = parent[cur];
  }
  path.push_back(src);
  std::reverse(path.begin(), path.end());
  return path;
}

std::vector<std::pair<NodeId,int>> Graph::incremental_louvain_apply(const std::vector<NodeId>& touched) {
  std::vector<std::pair<NodeId,int>> moves;
  for (auto v : touched) {
    if (!adj_.count(v)) continue;
    std::unordered_map<int,int> count;
    for (auto &e : adj_.at(v)) {
      int c = community_of_.count(e.to) ? community_of_.at(e.to) : 0;
      count[c]++;
    }
    int bestC = community_of_[v];
    int bestCnt = 0;
    for (auto &p : count) {
      if (p.second > bestCnt) { bestCnt = p.second; bestC = p.first; }
    }
    if (community_of_[v] != bestC) {
      community_of_[v] = bestC;
      moves.push_back({v,bestC});
    }
  }
  return moves;
}

std::string Graph::applyBatch(const std::vector<std::string>& batch) {
  std::ostringstream out;
  out << "{";
  out << "\"type\":\"delta\",";
  out << "\"moves\":[";
  bool firstMove = true;
  std::vector<NodeId> touched;
  std::ostringstream paths;
  paths << "\"paths\":[";
  bool firstPath = true;

  for (auto &cmdline : batch) {
    std::istringstream iss(cmdline);
    std::string cmd;
    iss >> cmd;
    if (cmd == "ADD_NODE") {
      NodeId id; iss >> id; add_node(id);
    } else if (cmd == "REMOVE_NODE") {
      NodeId id; iss >> id; remove_node(id);
    } else if (cmd == "ADD_EDGE") {
      NodeId u,v; double w=1.0; iss >> u >> v;
      if (!(iss >> w)) w=1.0;
      add_edge(u,v,w);
      touched.push_back(u); touched.push_back(v);
    } else if (cmd == "REMOVE_EDGE") {
      NodeId u,v; iss >> u >> v;
      remove_edge(u,v);
      touched.push_back(u); touched.push_back(v);
    } else if (cmd == "SHORTEST_PATH") {
      NodeId s,d; iss >> s >> d;
      auto path = shortest_path_bfs(s,d);
      if (!firstPath) paths << ",";
      firstPath = false;
      paths << "{"
            << "\"src\":" << s << ",\"dst\":" << d << ",\"path\":[";
      for (size_t i=0;i<path.size();++i) {
        if (i) paths << ",";
        paths << path[i];
      }
      paths << "]}";
    } else if (cmd == "RUN_LOUVAIN") {
      std::vector<NodeId> ids; NodeId t;
      while (iss >> t) ids.push_back(t);
      auto moves = incremental_louvain_apply(ids);
      for (auto &m : moves) {
        if (!firstMove) out << ",";
        firstMove = false;
        out << "{\"node\":"<<m.first<<",\"community\":"<<m.second<<"}";
      }
    }
  }

  out << "],";
  paths << "]";
  out << paths.str();
  out << "}";
  return out.str();
}
