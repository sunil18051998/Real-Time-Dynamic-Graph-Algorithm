#pragma once
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <mutex>
#include <shared_mutex>
#include <optional>
#include <string>
#include <queue>
#include <algorithm>

using NodeId = uint32_t;
using Weight = double;

struct Node {
    NodeId id;
    std::string label;
    int community = 0;
};

struct Edge {
    NodeId to;
    Weight w;
};

class Graph {
public:
    Graph() = default;

    // Node/Edge operations
    bool add_node(NodeId id, const std::string& label = "");
    bool remove_node(NodeId id);
    bool add_edge(NodeId u, NodeId v, Weight w = 1.0);
    bool remove_edge(NodeId u, NodeId v);

    bool has_node(NodeId id) const;
    std::vector<Edge> neighbors(NodeId id) const;

    std::optional<int> get_community(NodeId id) const;

    // Incremental algorithms
    std::vector<std::pair<NodeId,int>> incremental_louvain_apply(const std::vector<NodeId>& touched);
    void delta_bfs(NodeId u, NodeId v);

    // Shortest path BFS
    std::vector<NodeId> shortest_path_bfs(NodeId src, NodeId dst) const;

    // Batch command processing
    std::string applyBatch(const std::vector<std::string>& batch);

private:
    mutable std::shared_mutex graph_mutex_;
    std::unordered_map<NodeId, std::vector<Edge>> adj_;
    std::unordered_map<NodeId, Node> nodes_;         // stores node info (label, community)
    std::unordered_map<NodeId, int> community_of_;

    void remove_all_incident_edges(NodeId id);
};
