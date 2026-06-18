// Auto-generated from pipeline — do not edit manually
// Generated from Data Dragon 16.12.1

export type Gender = "Male" | "Female" | "Other";

export type Position = "Top" | "Jungle" | "Mid" | "ADC" | "Support";

export type Species = "Aspect" | "Baccai" | "Brackern" | "Cat" | "Celestial" | "Chemically Altered" | "Cyborg" | "Darkin" | "Demon" | "Dog" | "Dragon" | "God" | "God-Warrior" | "Golem" | "Human" | "Iceborn" | "Magically Altered" | "Magicborn" | "Minotaur" | "Plant" | "Rat" | "Revenant" | "Spirit" | "Spiritualist" | "Troll" | "Undead" | "Unknown" | "Vastayan" | "Void-Being" | "Yeti" | "Yordle";

export type Resource = "Bloodthirst" | "Courage" | "Energy" | "Ferocity" | "Flow" | "Fury" | "Grit" | "Health costs" | "Heat" | "Mana" | "Manaless" | "Rage" | "Shield";

export type RangeType = "Melee" | "Ranged";

export type Region = "Bandle City" | "Bilgewater" | "Camavor" | "Demacia" | "Freljord" | "Icathia" | "Ionia" | "Ixtal" | "Noxus" | "Piltover" | "Runeterra" | "Shadow Isles" | "Shurima" | "Targon" | "Void" | "Zaun";

export type Tag = "Assassin" | "Fighter" | "Mage" | "Marksman" | "Support" | "Tank";

export interface Ability {
  name: string;
  key: "Q" | "W" | "E" | "R" | "Passive";
  description: string;
  iconName: string;
}

export interface Champion {
  id: string;
  name: string;
  title: string;
  portraitName: string;
  gender: Gender;
  positions: Position[];
  species: Species[];
  resource: Resource;
  rangeType: RangeType[];
  regions: Region[];
  releaseYear: number;
  tags: Tag[];
  partype: string;
  attackrange: number;
  abilities: Ability[];
  quotes: string[];
}
