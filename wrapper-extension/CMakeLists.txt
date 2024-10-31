cmake_minimum_required(VERSION 3.10)
project(SteamWrapperExtension)

add_library(Steam_plus_x64.ext SHARED WrapperExtension.cpp Utils.cpp SteamCallbacks.cpp)

target_link_libraries(Steam_plus_x64.ext PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/steamworks-sdk/redistributable_bin/linux64/libsteam_api.so")

set_target_properties(Steam_plus_x64.ext PROPERTIES 
    PREFIX ""
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/../construct-plugin/)
