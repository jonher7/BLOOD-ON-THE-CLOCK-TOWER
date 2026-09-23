export type GrimorioTipo =
  | "aldeano"
  | "forastero"
  | "esbirro"
  | "diablillo";

export type GrimorioItem = {
  name: string;
  source: any;
  tipo: GrimorioTipo;
};


export const grimorioImages: GrimorioItem[] = [
  { name: "Guardian", tipo:"aldeano", source: require("../assets/images/grimorio/guardian.png") },
  { name: "Exterminador", tipo:"aldeano", source: require("../assets/images/grimorio/exterminado.png") },
  { name: "Soldado", tipo:"aldeano", source: require("../assets/images/grimorio/soldado.png") },
  { name: "Enterrador", tipo:"aldeano", source: require("../assets/images/grimorio/enterrador.png") },
  { name: "Virgen", tipo:"aldeano", source: require("../assets/images/grimorio/virgen.png") },
  { name: "Lavandera", tipo:"aldeano", source: require("../assets/images/grimorio/lavandera.png") },
  { name: "Chef", tipo:"aldeano", source: require("../assets/images/grimorio/chef.png") },
  { name: "Empatico", tipo:"aldeano", source: require("../assets/images/grimorio/empatico.png") },
  { name: "Pitonisa", tipo:"aldeano", source: require("../assets/images/grimorio/pitonisa.png") },
  { name: "Bibliotecario", tipo:"aldeano", source: require("../assets/images/grimorio/bibliotecario.png") },
  { name: "Investigador", tipo:"aldeano", source: require("../assets/images/grimorio/investigador.png") },
  { name: "Alcalde", tipo:"aldeano", source: require("../assets/images/grimorio/alcalde.png") },
  { name: "Monje", tipo:"aldeano", source: require("../assets/images/grimorio/monje.png") },



  { name: "Mayordomo", tipo:"forastero", source: require("../assets/images/grimorio/mayordomo.png") },
  { name: "Borracho", tipo:"forastero", source: require("../assets/images/grimorio/borracho.png") },
  { name: "Recluso", tipo:"forastero", source: require("../assets/images/grimorio/recluso.png") },
  { name: "Santo", tipo:"forastero", source: require("../assets/images/grimorio/santo.png") },
  
  
  { name: "Envenenador", tipo:"esbirro", source: require("../assets/images/grimorio/envenenador.png") },
  { name: "Mujer_escarlata", tipo:"esbirro", source: require("../assets/images/grimorio/mujer_escarlata.png") },
  { name: "Espia", tipo:"esbirro", source: require("../assets/images/grimorio/espia.png") },
  { name: "Baron", tipo:"esbirro", source: require("../assets/images/grimorio/baron.png") },
  
  
  { name: "Diablillo", tipo:"diablillo", source: require("../assets/images/grimorio/diablillo.png") },
];
