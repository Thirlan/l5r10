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
