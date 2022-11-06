import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  switchMode(){
    this.isLoginMode = !this.isLoginMode;
  }

  submit(form: NgForm) {
    this.error = '';
    if(!form.valid) return;

    this.loading = true;
    if(this.isLoginMode) {
      this.authService.login(form.value).subscribe(res => {
        this.loading = false;
        this.authService.saveToken( res.accessToken);
        this.authService.saveRefreshToken( res.refreshToken);
        localStorage.setItem('user_info', JSON.stringify({name: res.name, id: res.id}));
        this.router.navigate(['/chat']);
      }, (err: any) => {
        console.log(err);
        this.error = "Something went wrong"
        this.loading = false;
      });
    } else {
      this.authService.signUp(form.value).subscribe(res => {
        this.loading = false;
      }), (err: any) => { 
        this.error = err.error
        this.loading = false;
      }
    }

    form.reset();
  }

}
