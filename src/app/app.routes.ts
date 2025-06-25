import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { ChangePasswordComponent } from './auth/change-password/change-password.component';
import { AdminApprovalComponent } from './admin-approval/admin-approval.component';
import { LonglistComponent } from './longlist/longlist.component';
import { ShortlistComponent } from './shortlist/shortlist.component';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  { path: 'admin-approval', component: AdminApprovalComponent, canActivate: [AdminGuard] },
  { path: 'longlist', component: LonglistComponent },
  { path: 'shortlist', component: ShortlistComponent },
  { path: '**', redirectTo: '/login' }
];
