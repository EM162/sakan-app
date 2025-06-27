import { Component, OnInit } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../core/services/auth.service';
import { Console } from 'console';
import { Router } from '@angular/router';

@Component({
    selector: 'app-hometest',
    imports: [],
    standalone:true,
    templateUrl: './hometest.component.html',
    styleUrl: './hometest.component.css'
})
export class HometestComponent implements OnInit {
  username!: string  | undefined;
  decodedToken: any;

  
  constructor(private authservice:AuthService) {
    
  }
  ngOnInit(): void {
    // this.username = this.authservice.getuserdata()?.username;
    // console.log('name = ' + this.authservice.getuserdata()?.username);
    // console.log('USERNAME is = ' + this.username);

    this.username = this.authservice.getUserData()?.name;
    console.log('name = ' + this.username);
   

  }
}
