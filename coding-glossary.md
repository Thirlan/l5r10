# Intro
Glossary for coding terms used in this project

|Term|Definition|
|-|-|
|SkillCheck|An immutable object that defines a skill or raw-trait check and its target number.|
|MapDragToPan|A class that pans the map when the user drags it with the left mouse button. It works only when the Pan map tool is selected.|
|Map tool|The selected action for a click on the world map viewer: path finding, measure distance, or pan.|
|MapModel|The in-memory model of the saved map grid for the 3D map. It holds one catalog ID array for each layer, river and cliff direction masks, and lists of settlements, resources, and labels.|
|Direction mask|An 8-bit number made from saved direction flags. Bit 0 is north, then the bits go clockwise to bit 7, northwest.|
|Land bounds|The smallest cell rectangle that holds all land cells of the map.|
|HeightField|The one global height sampler of the 3D map. It holds a height for each lattice point, so that all terrain chunks share the same edge heights.|
|Lattice point|One vertex position of the terrain surface. Each map cell has a fixed number of lattice steps on each side (the subdivisions).|
|River segment|A line from a river cell center to a cell edge, a cell corner, or a water cell center. The height field carves river channels along these lines.|
|Chunk range|The rectangle of map cells that one terrain chunk mesh covers. The end column and the end row are not in the range.|
|Surface palette|The climate colors and water colors that the 3D map uses for vertex colors before the textures load.|
|Surface layer|One PBR texture set of the 3D map, and its index in the texture arrays. Layer 0 (moon_dusted_01) is the default layer.|
|Cell ID texture|A small RGBA texture with one pixel for each map cell. It gives the primary layer, the steep-slope layer, the snow line, and the water class of the cell. It uses NEAREST filtering.|
|Albedo layer|One layer of the albedo texture array: the diffuse color in RGB and the displacement in alpha.|
|Shading layer|One layer of the shading texture array: the normal X and Y in red and green, and the roughness in blue.|
|Pixel source|An object {data, channels, scale} that gives pixel values from 0 to 1 for the PBR texture helpers.|
|Water class|The kind of water under a cell for the 3D terrain shader: lake (also rivers), coastal, or ocean. It selects the tint of the ground under the water.|
|Water plane|One flat mesh at the water level over the full 3D map. It uses the WaterMaterial, and shows only where the terrain is below it.|
|Seal pass|The last river step of the HeightField. It walks along each river segment and lowers the lattice quads where the surface is not below the water plane.|
|Chunk index|The position of a chunk in the chunkRanges list. Roads, trees, and markers use it to join the chunk that owns them.|
|Road link|One straight road or footpath piece between the centers of two neighbor cells in the 3D map. It uses the kind of its start cell.|
|Junction cap|A small flat disc at the center of a road cell. It fills the gaps where road links meet.|
|Cover height|The highest surface height on the lines from a road vertex to its neighbor vertices. The road vertex uses it, so that the road triangles stay above the terrain.|
|Bridge deck|The lowest height of a road in the 3D map. Over rivers and water, roads stay at this height above the water plane.|
|Tree candidate|One possible tree position in a vegetation cell, from a hash of the cell and the candidate number. Filters remove candidates on water, steep slopes, snow, roads, and settlement clearings.|
|Tree prototype|The geometry of one tree kind (trunk and canopy), with its base at the origin. Thin instances place copies of it.|
|Thin instance|A Babylon.js copy of a mesh that has only a world matrix (and an optional color) in a buffer. One draw call shows all thin instances of a mesh.|
|Settlement clearing|The circle around a settlement cell center where no trees are placed, so the settlement marker stays visible.|
