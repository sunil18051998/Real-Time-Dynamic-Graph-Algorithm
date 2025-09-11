#include "Graph.h"
#include <iostream>
#include <string>
#include <vector>

int main() {
  Graph g;
  std::string line;
  std::cout << "{\"type\":\"ready\"}" << std::endl;

  while (std::getline(std::cin, line)) {
    if (line.empty()) continue;
    // Commands separated by semicolon for batch
    std::vector<std::string> cmds;
    size_t start=0;
    while (true) {
      size_t pos = line.find(';', start);
      if (pos == std::string::npos) {
        cmds.push_back(line.substr(start));
        break;
      } else {
        cmds.push_back(line.substr(start, pos-start));
        start = pos+1;
      }
    }
    std::string delta = g.applyBatch(cmds);
    std::cout << delta << std::endl;
  }
  return 0;
}
