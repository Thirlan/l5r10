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
