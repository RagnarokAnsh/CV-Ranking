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
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { RedirectGuard } from './guards/redirect.guard';

export const routes: Routes = [
  { path: '', canActivate: [RedirectGuard], children: [] },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [GuestGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [GuestGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [AuthGuard] },
  { path: 'admin-approval', component: AdminApprovalComponent, canActivate: [AdminGuard] },
  { path: 'longlist', component: LonglistComponent, canActivate: [AuthGuard] },
  { path: 'shortlist', component: ShortlistComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];
