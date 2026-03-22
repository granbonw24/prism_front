export class Anneescolaire {

    id!:string;
    libelle_annee!:string;
    debut!: Date;
    fin!: Date;
    theme!: string;
    statut!:string;


  constructor(id: string, libelle_annee: string, debut: Date, fin: Date, theme:string, statut:string) {
    this.id = id;
    this.libelle_annee = libelle_annee;
    this.debut = debut;
    this.fin = fin;
    this.theme = theme;
    this.statut = statut;

  }

}

