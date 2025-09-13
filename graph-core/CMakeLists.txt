cmake_minimum_required(VERSION 3.16)
project(graph_core LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(SRCS
  src/main.cpp
  src/Graph.cpp
)

include_directories(${CMAKE_SOURCE_DIR}/include)


add_executable(graph_core ${SRCS})
target_include_directories(graph_core PRIVATE src)
