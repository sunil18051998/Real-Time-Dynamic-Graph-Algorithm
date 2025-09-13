#include "Graph.h"
#include <sstream>
#include <queue>
#include <algorithm>
#include <iostream>


// ------------------ Node / Edge operations ------------------
bool Graph::add_node(NodeId id, const std::string& label) {
    std::unique_lock lock(graph_mutex_);
    if (nodes_.count(id)) return false;
    nodes_[id] = Node{id, label, static_cast<int>(id)};
    std::cout << "[DEBUG] Adding node " << id << "\n";
    std::cout << "[DEBUG] Nodes in graph: " << nodes_.size() << "\n";
    std::cout << "[DEBUG] Edges in graph: " << adj_.size() << "\n";
    community_of_[id] = static_cast<int>(id);
    adj_[id] = {};
    return true;
}

bool Graph::remove_node(NodeId id) {
    std::unique_lock lock(graph_mutex_);
    if (!adj_.count(id)) return false;
    remove_all_incident_edges(id);
    adj_.erase(id);
    nodes_.erase(id);
    community_of_.erase(id);
    return true;
}

bool Graph::add_edge(NodeId u, NodeId v, Weight w) {
    std::unique_lock lock(graph_mutex_);
    if (!nodes_.count(u)) add_node(u);
    if (!nodes_.count(v)) add_node(v);

    auto &vecU = adj_[u];
    auto itU = std::find_if(vecU.begin(), vecU.end(), [&](const Edge &e){ return e.to == v; });
    if (itU != vecU.end()) return false; // edge exists

    vecU.push_back({v,w});
    adj_[v].push_back({u,w});
    return true;
}

bool Graph::remove_edge(NodeId u, NodeId v) {
    std::unique_lock lock(graph_mutex_);
    if (!adj_.count(u) || !adj_.count(v)) return false;

    auto &vecU = adj_[u];
    vecU.erase(std::remove_if(vecU.begin(), vecU.end(),
                [&](const Edge &e){ return e.to == v; }), vecU.end());

    auto &vecV = adj_[v];
    vecV.erase(std::remove_if(vecV.begin(), vecV.end(),
                [&](const Edge &e){ return e.to == u; }), vecV.end());

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

void Graph::remove_all_incident_edges(NodeId id) {
    for (auto &kv : adj_) {
        auto &vec = kv.second;
        vec.erase(std::remove_if(vec.begin(), vec.end(),
                    [&](const Edge &e){ return e.to == id; }), vec.end());
    }
}

// ------------------ Incremental Louvain ------------------
std::vector<std::pair<NodeId,int>> Graph::incremental_louvain_apply(const std::vector<NodeId>& touched) {
    std::unique_lock lock(graph_mutex_);
    std::vector<std::pair<NodeId,int>> moves;

    std::cout << "[DEBUG] Louvain running. Nodes in graph: " << adj_.size() << "\n";


    for (auto v : touched) {
        if (!adj_.count(v)) continue;
        std::unordered_map<int,int> count;
        for (const auto &e : adj_[v]) {
            int c = community_of_.count(e.to) ? community_of_[e.to] : 0;
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

     std::cout << "[DEBUG] Louvain produced " << moves.size() << " moves.\n";
    return moves;
}

// ------------------ Shortest Path BFS ------------------
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

// ------------------ Batch command processing ------------------
std::string Graph::applyBatch(const std::vector<std::string>& batch) {
    std::ostringstream out;
    out << "{";
    out << "\"type\":\"delta apply\",";
    out << "\"moves\":["; ;

    bool firstMove = true;
    std::vector<NodeId> touched;
    std::ostringstream paths;
    paths << "\"paths\":[";
    bool firstPath = true;

    //out << batch.size();

    for (auto &cmdline : batch) {
        out << cmdline;
        std::istringstream iss(cmdline);
        std::string cmd;
        iss >> cmd;

        if (cmd == "ADD_NODE") {
            //std::cout<<"[DEBUG] ADD_NODE\n";
            NodeId id; iss >> id;
            //out << "{" << "ADD_NODE" << id <<"},";
            add_node(id);
        } else if (cmd == "REMOVE_NODE") {
            NodeId id; iss >> id;
            remove_node(id);
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
            std::cout << "[DEBUG] Running Louvain on touched nodes: ";
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
