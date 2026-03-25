import { HttpClient } from '@angular/common/http';
import { Component,inject, OnInit } from '@angular/core';

@Component({
  selector: 'app-anneescolaire',
  standalone: true,
  imports: [],
  templateUrl: './anneescolaire.component.html',
  styleUrl: './anneescolaire.component.css'
})
export class AnneescolaireComponent implements OnInit {

  // httpClient = inject(HttpClient);

  constructor(private httpClient: HttpClient) {}

  data : any[]=[];

  ngOnInit(): void {
   this.fetchData();
  }

  fetchData(){
    this.httpClient.get('http://localhost:8000/api/annee').subscribe((data:any)=>{

      console.log(data);

    });
  }

}
