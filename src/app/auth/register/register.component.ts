import { Component, OnInit, HostListener, ViewChild, ViewContainerRef, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterRequest } from '../../services/auth.service';

// PrimeNG Imports - Only keeping Button, InputText, Card, Toast for other components
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Angular Material Date Picker Imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import * as countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { Overlay, OverlayRef, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

interface CountryCode {
  label: string;
  value: string;
  flag: string;
  name: string;
  code: string;
}

interface DropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    ToastModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  showGenderDropdown = false;
  showCountryFieldDropdown = false;
  showNationalityDropdown = false;
  showPassword = false;
  showConfirmPassword = false;

  @ViewChild('countryCodeDropdownPanel') countryCodeDropdownPanel!: TemplateRef<any>;
  private countryCodeOverlayRef: OverlayRef | null = null;

  countryCodes: CountryCode[] = [
    { label: '+1', value: '+1', flag: 'https://flagcdn.com/w20/us.png', name: 'United States', code: 'US' },
    { label: '+1', value: '+1', flag: 'https://flagcdn.com/w20/ca.png', name: 'Canada', code: 'CA' },
    { label: '+7', value: '+7', flag: 'https://flagcdn.com/w20/ru.png', name: 'Russia', code: 'RU' },
    { label: '+7', value: '+7', flag: 'https://flagcdn.com/w20/kz.png', name: 'Kazakhstan', code: 'KZ' },
    { label: '+20', value: '+20', flag: 'https://flagcdn.com/w20/eg.png', name: 'Egypt', code: 'EG' },
    { label: '+27', value: '+27', flag: 'https://flagcdn.com/w20/za.png', name: 'South Africa', code: 'ZA' },
    { label: '+30', value: '+30', flag: 'https://flagcdn.com/w20/gr.png', name: 'Greece', code: 'GR' },
    { label: '+31', value: '+31', flag: 'https://flagcdn.com/w20/nl.png', name: 'Netherlands', code: 'NL' },
    { label: '+32', value: '+32', flag: 'https://flagcdn.com/w20/be.png', name: 'Belgium', code: 'BE' },
    { label: '+33', value: '+33', flag: 'https://flagcdn.com/w20/fr.png', name: 'France', code: 'FR' },
    { label: '+34', value: '+34', flag: 'https://flagcdn.com/w20/es.png', name: 'Spain', code: 'ES' },
    { label: '+36', value: '+36', flag: 'https://flagcdn.com/w20/hu.png', name: 'Hungary', code: 'HU' },
    { label: '+39', value: '+39', flag: 'https://flagcdn.com/w20/it.png', name: 'Italy', code: 'IT' },
    { label: '+40', value: '+40', flag: 'https://flagcdn.com/w20/ro.png', name: 'Romania', code: 'RO' },
    { label: '+41', value: '+41', flag: 'https://flagcdn.com/w20/ch.png', name: 'Switzerland', code: 'CH' },
    { label: '+43', value: '+43', flag: 'https://flagcdn.com/w20/at.png', name: 'Austria', code: 'AT' },
    { label: '+44', value: '+44', flag: 'https://flagcdn.com/w20/gb.png', name: 'United Kingdom', code: 'GB' },
    { label: '+45', value: '+45', flag: 'https://flagcdn.com/w20/dk.png', name: 'Denmark', code: 'DK' },
    { label: '+46', value: '+46', flag: 'https://flagcdn.com/w20/se.png', name: 'Sweden', code: 'SE' },
    { label: '+47', value: '+47', flag: 'https://flagcdn.com/w20/no.png', name: 'Norway', code: 'NO' },
    { label: '+48', value: '+48', flag: 'https://flagcdn.com/w20/pl.png', name: 'Poland', code: 'PL' },
    { label: '+49', value: '+49', flag: 'https://flagcdn.com/w20/de.png', name: 'Germany', code: 'DE' },
    { label: '+51', value: '+51', flag: 'https://flagcdn.com/w20/pe.png', name: 'Peru', code: 'PE' },
    { label: '+52', value: '+52', flag: 'https://flagcdn.com/w20/mx.png', name: 'Mexico', code: 'MX' },
    { label: '+53', value: '+53', flag: 'https://flagcdn.com/w20/cu.png', name: 'Cuba', code: 'CU' },
    { label: '+54', value: '+54', flag: 'https://flagcdn.com/w20/ar.png', name: 'Argentina', code: 'AR' },
    { label: '+55', value: '+55', flag: 'https://flagcdn.com/w20/br.png', name: 'Brazil', code: 'BR' },
    { label: '+56', value: '+56', flag: 'https://flagcdn.com/w20/cl.png', name: 'Chile', code: 'CL' },
    { label: '+57', value: '+57', flag: 'https://flagcdn.com/w20/co.png', name: 'Colombia', code: 'CO' },
    { label: '+58', value: '+58', flag: 'https://flagcdn.com/w20/ve.png', name: 'Venezuela', code: 'VE' },
    { label: '+60', value: '+60', flag: 'https://flagcdn.com/w20/my.png', name: 'Malaysia', code: 'MY' },
    { label: '+61', value: '+61', flag: 'https://flagcdn.com/w20/au.png', name: 'Australia', code: 'AU' },
    { label: '+62', value: '+62', flag: 'https://flagcdn.com/w20/id.png', name: 'Indonesia', code: 'ID' },
    { label: '+63', value: '+63', flag: 'https://flagcdn.com/w20/ph.png', name: 'Philippines', code: 'PH' },
    { label: '+64', value: '+64', flag: 'https://flagcdn.com/w20/nz.png', name: 'New Zealand', code: 'NZ' },
    { label: '+65', value: '+65', flag: 'https://flagcdn.com/w20/sg.png', name: 'Singapore', code: 'SG' },
    { label: '+66', value: '+66', flag: 'https://flagcdn.com/w20/th.png', name: 'Thailand', code: 'TH' },
    { label: '+81', value: '+81', flag: 'https://flagcdn.com/w20/jp.png', name: 'Japan', code: 'JP' },
    { label: '+82', value: '+82', flag: 'https://flagcdn.com/w20/kr.png', name: 'South Korea', code: 'KR' },
    { label: '+84', value: '+84', flag: 'https://flagcdn.com/w20/vn.png', name: 'Vietnam', code: 'VN' },
    { label: '+86', value: '+86', flag: 'https://flagcdn.com/w20/cn.png', name: 'China', code: 'CN' },
    { label: '+90', value: '+90', flag: 'https://flagcdn.com/w20/tr.png', name: 'Turkey', code: 'TR' },
    { label: '+91', value: '+91', flag: 'https://flagcdn.com/w20/in.png', name: 'India', code: 'IN' },
    { label: '+92', value: '+92', flag: 'https://flagcdn.com/w20/pk.png', name: 'Pakistan', code: 'PK' },
    { label: '+93', value: '+93', flag: 'https://flagcdn.com/w20/af.png', name: 'Afghanistan', code: 'AF' },
    { label: '+94', value: '+94', flag: 'https://flagcdn.com/w20/lk.png', name: 'Sri Lanka', code: 'LK' },
    { label: '+95', value: '+95', flag: 'https://flagcdn.com/w20/mm.png', name: 'Myanmar', code: 'MM' },
    { label: '+98', value: '+98', flag: 'https://flagcdn.com/w20/ir.png', name: 'Iran', code: 'IR' },
    { label: '+212', value: '+212', flag: 'https://flagcdn.com/w20/ma.png', name: 'Morocco', code: 'MA' },
    { label: '+213', value: '+213', flag: 'https://flagcdn.com/w20/dz.png', name: 'Algeria', code: 'DZ' },
    { label: '+216', value: '+216', flag: 'https://flagcdn.com/w20/tn.png', name: 'Tunisia', code: 'TN' },
    { label: '+218', value: '+218', flag: 'https://flagcdn.com/w20/ly.png', name: 'Libya', code: 'LY' },
    { label: '+220', value: '+220', flag: 'https://flagcdn.com/w20/gm.png', name: 'Gambia', code: 'GM' },
    { label: '+221', value: '+221', flag: 'https://flagcdn.com/w20/sn.png', name: 'Senegal', code: 'SN' },
    { label: '+222', value: '+222', flag: 'https://flagcdn.com/w20/mr.png', name: 'Mauritania', code: 'MR' },
    { label: '+223', value: '+223', flag: 'https://flagcdn.com/w20/ml.png', name: 'Mali', code: 'ML' },
    { label: '+224', value: '+224', flag: 'https://flagcdn.com/w20/gn.png', name: 'Guinea', code: 'GN' },
    { label: '+225', value: '+225', flag: 'https://flagcdn.com/w20/ci.png', name: 'Ivory Coast', code: 'CI' },
    { label: '+226', value: '+226', flag: 'https://flagcdn.com/w20/bf.png', name: 'Burkina Faso', code: 'BF' },
    { label: '+227', value: '+227', flag: 'https://flagcdn.com/w20/ne.png', name: 'Niger', code: 'NE' },
    { label: '+228', value: '+228', flag: 'https://flagcdn.com/w20/tg.png', name: 'Togo', code: 'TG' },
    { label: '+229', value: '+229', flag: 'https://flagcdn.com/w20/bj.png', name: 'Benin', code: 'BJ' },
    { label: '+230', value: '+230', flag: 'https://flagcdn.com/w20/mu.png', name: 'Mauritius', code: 'MU' },
    { label: '+231', value: '+231', flag: 'https://flagcdn.com/w20/lr.png', name: 'Liberia', code: 'LR' },
    { label: '+232', value: '+232', flag: 'https://flagcdn.com/w20/sl.png', name: 'Sierra Leone', code: 'SL' },
    { label: '+233', value: '+233', flag: 'https://flagcdn.com/w20/gh.png', name: 'Ghana', code: 'GH' },
    { label: '+234', value: '+234', flag: 'https://flagcdn.com/w20/ng.png', name: 'Nigeria', code: 'NG' },
    { label: '+235', value: '+235', flag: 'https://flagcdn.com/w20/td.png', name: 'Chad', code: 'TD' },
    { label: '+236', value: '+236', flag: 'https://flagcdn.com/w20/cf.png', name: 'Central African Republic', code: 'CF' },
    { label: '+237', value: '+237', flag: 'https://flagcdn.com/w20/cm.png', name: 'Cameroon', code: 'CM' },
    { label: '+238', value: '+238', flag: 'https://flagcdn.com/w20/cv.png', name: 'Cape Verde', code: 'CV' },
    { label: '+239', value: '+239', flag: 'https://flagcdn.com/w20/st.png', name: 'São Tomé and Príncipe', code: 'ST' },
    { label: '+240', value: '+240', flag: 'https://flagcdn.com/w20/gq.png', name: 'Equatorial Guinea', code: 'GQ' },
    { label: '+241', value: '+241', flag: 'https://flagcdn.com/w20/ga.png', name: 'Gabon', code: 'GA' },
    { label: '+242', value: '+242', flag: 'https://flagcdn.com/w20/cg.png', name: 'Republic of the Congo', code: 'CG' },
    { label: '+243', value: '+243', flag: 'https://flagcdn.com/w20/cd.png', name: 'Democratic Republic of the Congo', code: 'CD' },
    { label: '+244', value: '+244', flag: 'https://flagcdn.com/w20/ao.png', name: 'Angola', code: 'AO' },
    { label: '+245', value: '+245', flag: 'https://flagcdn.com/w20/gw.png', name: 'Guinea-Bissau', code: 'GW' },
    { label: '+246', value: '+246', flag: 'https://flagcdn.com/w20/io.png', name: 'British Indian Ocean Territory', code: 'IO' },
    { label: '+248', value: '+248', flag: 'https://flagcdn.com/w20/sc.png', name: 'Seychelles', code: 'SC' },
    { label: '+249', value: '+249', flag: 'https://flagcdn.com/w20/sd.png', name: 'Sudan', code: 'SD' },
    { label: '+250', value: '+250', flag: 'https://flagcdn.com/w20/rw.png', name: 'Rwanda', code: 'RW' },
    { label: '+251', value: '+251', flag: 'https://flagcdn.com/w20/et.png', name: 'Ethiopia', code: 'ET' },
    { label: '+252', value: '+252', flag: 'https://flagcdn.com/w20/so.png', name: 'Somalia', code: 'SO' },
    { label: '+253', value: '+253', flag: 'https://flagcdn.com/w20/dj.png', name: 'Djibouti', code: 'DJ' },
    { label: '+254', value: '+254', flag: 'https://flagcdn.com/w20/ke.png', name: 'Kenya', code: 'KE' },
    { label: '+255', value: '+255', flag: 'https://flagcdn.com/w20/tz.png', name: 'Tanzania', code: 'TZ' },
    { label: '+256', value: '+256', flag: 'https://flagcdn.com/w20/ug.png', name: 'Uganda', code: 'UG' },
    { label: '+257', value: '+257', flag: 'https://flagcdn.com/w20/bi.png', name: 'Burundi', code: 'BI' },
    { label: '+258', value: '+258', flag: 'https://flagcdn.com/w20/mz.png', name: 'Mozambique', code: 'MZ' },
    { label: '+260', value: '+260', flag: 'https://flagcdn.com/w20/zm.png', name: 'Zambia', code: 'ZM' },
    { label: '+261', value: '+261', flag: 'https://flagcdn.com/w20/mg.png', name: 'Madagascar', code: 'MG' },
    { label: '+262', value: '+262', flag: 'https://flagcdn.com/w20/re.png', name: 'Réunion', code: 'RE' },
    { label: '+263', value: '+263', flag: 'https://flagcdn.com/w20/zw.png', name: 'Zimbabwe', code: 'ZW' },
    { label: '+264', value: '+264', flag: 'https://flagcdn.com/w20/na.png', name: 'Namibia', code: 'NA' },
    { label: '+265', value: '+265', flag: 'https://flagcdn.com/w20/mw.png', name: 'Malawi', code: 'MW' },
    { label: '+266', value: '+266', flag: 'https://flagcdn.com/w20/ls.png', name: 'Lesotho', code: 'LS' },
    { label: '+267', value: '+267', flag: 'https://flagcdn.com/w20/bw.png', name: 'Botswana', code: 'BW' },
    { label: '+268', value: '+268', flag: 'https://flagcdn.com/w20/sz.png', name: 'Eswatini', code: 'SZ' },
    { label: '+269', value: '+269', flag: 'https://flagcdn.com/w20/km.png', name: 'Comoros', code: 'KM' },
    { label: '+290', value: '+290', flag: 'https://flagcdn.com/w20/sh.png', name: 'Saint Helena', code: 'SH' },
    { label: '+291', value: '+291', flag: 'https://flagcdn.com/w20/er.png', name: 'Eritrea', code: 'ER' },
    { label: '+297', value: '+297', flag: 'https://flagcdn.com/w20/aw.png', name: 'Aruba', code: 'AW' },
    { label: '+298', value: '+298', flag: 'https://flagcdn.com/w20/fo.png', name: 'Faroe Islands', code: 'FO' },
    { label: '+299', value: '+299', flag: 'https://flagcdn.com/w20/gl.png', name: 'Greenland', code: 'GL' },
    { label: '+350', value: '+350', flag: 'https://flagcdn.com/w20/gi.png', name: 'Gibraltar', code: 'GI' },
    { label: '+351', value: '+351', flag: 'https://flagcdn.com/w20/pt.png', name: 'Portugal', code: 'PT' },
    { label: '+352', value: '+352', flag: 'https://flagcdn.com/w20/lu.png', name: 'Luxembourg', code: 'LU' },
    { label: '+353', value: '+353', flag: 'https://flagcdn.com/w20/ie.png', name: 'Ireland', code: 'IE' },
    { label: '+354', value: '+354', flag: 'https://flagcdn.com/w20/is.png', name: 'Iceland', code: 'IS' },
    { label: '+355', value: '+355', flag: 'https://flagcdn.com/w20/al.png', name: 'Albania', code: 'AL' },
    { label: '+356', value: '+356', flag: 'https://flagcdn.com/w20/mt.png', name: 'Malta', code: 'MT' },
    { label: '+357', value: '+357', flag: 'https://flagcdn.com/w20/cy.png', name: 'Cyprus', code: 'CY' },
    { label: '+358', value: '+358', flag: 'https://flagcdn.com/w20/fi.png', name: 'Finland', code: 'FI' },
    { label: '+359', value: '+359', flag: 'https://flagcdn.com/w20/bg.png', name: 'Bulgaria', code: 'BG' },
    { label: '+370', value: '+370', flag: 'https://flagcdn.com/w20/lt.png', name: 'Lithuania', code: 'LT' },
    { label: '+371', value: '+371', flag: 'https://flagcdn.com/w20/lv.png', name: 'Latvia', code: 'LV' },
    { label: '+372', value: '+372', flag: 'https://flagcdn.com/w20/ee.png', name: 'Estonia', code: 'EE' },
    { label: '+373', value: '+373', flag: 'https://flagcdn.com/w20/md.png', name: 'Moldova', code: 'MD' },
    { label: '+374', value: '+374', flag: 'https://flagcdn.com/w20/am.png', name: 'Armenia', code: 'AM' },
    { label: '+375', value: '+375', flag: 'https://flagcdn.com/w20/by.png', name: 'Belarus', code: 'BY' },
    { label: '+376', value: '+376', flag: 'https://flagcdn.com/w20/ad.png', name: 'Andorra', code: 'AD' },
    { label: '+377', value: '+377', flag: 'https://flagcdn.com/w20/mc.png', name: 'Monaco', code: 'MC' },
    { label: '+378', value: '+378', flag: 'https://flagcdn.com/w20/sm.png', name: 'San Marino', code: 'SM' },
    { label: '+380', value: '+380', flag: 'https://flagcdn.com/w20/ua.png', name: 'Ukraine', code: 'UA' },
    { label: '+381', value: '+381', flag: 'https://flagcdn.com/w20/rs.png', name: 'Serbia', code: 'RS' },
    { label: '+382', value: '+382', flag: 'https://flagcdn.com/w20/me.png', name: 'Montenegro', code: 'ME' },
    { label: '+383', value: '+383', flag: 'https://flagcdn.com/w20/xk.png', name: 'Kosovo', code: 'XK' },
    { label: '+385', value: '+385', flag: 'https://flagcdn.com/w20/hr.png', name: 'Croatia', code: 'HR' },
    { label: '+386', value: '+386', flag: 'https://flagcdn.com/w20/si.png', name: 'Slovenia', code: 'SI' },
    { label: '+387', value: '+387', flag: 'https://flagcdn.com/w20/ba.png', name: 'Bosnia and Herzegovina', code: 'BA' },
    { label: '+389', value: '+389', flag: 'https://flagcdn.com/w20/mk.png', name: 'North Macedonia', code: 'MK' },
    { label: '+420', value: '+420', flag: 'https://flagcdn.com/w20/cz.png', name: 'Czech Republic', code: 'CZ' },
    { label: '+421', value: '+421', flag: 'https://flagcdn.com/w20/sk.png', name: 'Slovakia', code: 'SK' },
    { label: '+423', value: '+423', flag: 'https://flagcdn.com/w20/li.png', name: 'Liechtenstein', code: 'LI' },
    { label: '+500', value: '+500', flag: 'https://flagcdn.com/w20/fk.png', name: 'Falkland Islands', code: 'FK' },
    { label: '+501', value: '+501', flag: 'https://flagcdn.com/w20/bz.png', name: 'Belize', code: 'BZ' },
    { label: '+502', value: '+502', flag: 'https://flagcdn.com/w20/gt.png', name: 'Guatemala', code: 'GT' },
    { label: '+503', value: '+503', flag: 'https://flagcdn.com/w20/sv.png', name: 'El Salvador', code: 'SV' },
    { label: '+504', value: '+504', flag: 'https://flagcdn.com/w20/hn.png', name: 'Honduras', code: 'HN' },
    { label: '+505', value: '+505', flag: 'https://flagcdn.com/w20/ni.png', name: 'Nicaragua', code: 'NI' },
    { label: '+506', value: '+506', flag: 'https://flagcdn.com/w20/cr.png', name: 'Costa Rica', code: 'CR' },
    { label: '+507', value: '+507', flag: 'https://flagcdn.com/w20/pa.png', name: 'Panama', code: 'PA' },
    { label: '+508', value: '+508', flag: 'https://flagcdn.com/w20/pm.png', name: 'Saint Pierre and Miquelon', code: 'PM' },
    { label: '+509', value: '+509', flag: 'https://flagcdn.com/w20/ht.png', name: 'Haiti', code: 'HT' },
    { label: '+590', value: '+590', flag: 'https://flagcdn.com/w20/gp.png', name: 'Guadeloupe', code: 'GP' },
    { label: '+591', value: '+591', flag: 'https://flagcdn.com/w20/bo.png', name: 'Bolivia', code: 'BO' },
    { label: '+592', value: '+592', flag: 'https://flagcdn.com/w20/gy.png', name: 'Guyana', code: 'GY' },
    { label: '+593', value: '+593', flag: 'https://flagcdn.com/w20/ec.png', name: 'Ecuador', code: 'EC' },
    { label: '+594', value: '+594', flag: 'https://flagcdn.com/w20/gf.png', name: 'French Guiana', code: 'GF' },
    { label: '+595', value: '+595', flag: 'https://flagcdn.com/w20/py.png', name: 'Paraguay', code: 'PY' },
    { label: '+596', value: '+596', flag: 'https://flagcdn.com/w20/mq.png', name: 'Martinique', code: 'MQ' },
    { label: '+597', value: '+597', flag: 'https://flagcdn.com/w20/sr.png', name: 'Suriname', code: 'SR' },
    { label: '+598', value: '+598', flag: 'https://flagcdn.com/w20/uy.png', name: 'Uruguay', code: 'UY' },
    { label: '+599', value: '+599', flag: 'https://flagcdn.com/w20/cw.png', name: 'Curaçao', code: 'CW' },
    { label: '+670', value: '+670', flag: 'https://flagcdn.com/w20/tl.png', name: 'East Timor', code: 'TL' },
    { label: '+672', value: '+672', flag: 'https://flagcdn.com/w20/aq.png', name: 'Antarctica', code: 'AQ' },
    { label: '+673', value: '+673', flag: 'https://flagcdn.com/w20/bn.png', name: 'Brunei', code: 'BN' },
    { label: '+674', value: '+674', flag: 'https://flagcdn.com/w20/nr.png', name: 'Nauru', code: 'NR' },
    { label: '+675', value: '+675', flag: 'https://flagcdn.com/w20/pg.png', name: 'Papua New Guinea', code: 'PG' },
    { label: '+676', value: '+676', flag: 'https://flagcdn.com/w20/to.png', name: 'Tonga', code: 'TO' },
    { label: '+677', value: '+677', flag: 'https://flagcdn.com/w20/sb.png', name: 'Solomon Islands', code: 'SB' },
    { label: '+678', value: '+678', flag: 'https://flagcdn.com/w20/vu.png', name: 'Vanuatu', code: 'VU' },
    { label: '+679', value: '+679', flag: 'https://flagcdn.com/w20/fj.png', name: 'Fiji', code: 'FJ' },
    { label: '+680', value: '+680', flag: 'https://flagcdn.com/w20/pw.png', name: 'Palau', code: 'PW' },
    { label: '+681', value: '+681', flag: 'https://flagcdn.com/w20/wf.png', name: 'Wallis and Futuna', code: 'WF' },
    { label: '+682', value: '+682', flag: 'https://flagcdn.com/w20/ck.png', name: 'Cook Islands', code: 'CK' },
    { label: '+683', value: '+683', flag: 'https://flagcdn.com/w20/nu.png', name: 'Niue', code: 'NU' },
    { label: '+684', value: '+684', flag: 'https://flagcdn.com/w20/as.png', name: 'American Samoa', code: 'AS' },
    { label: '+685', value: '+685', flag: 'https://flagcdn.com/w20/ws.png', name: 'Samoa', code: 'WS' },
    { label: '+686', value: '+686', flag: 'https://flagcdn.com/w20/ki.png', name: 'Kiribati', code: 'KI' },
    { label: '+687', value: '+687', flag: 'https://flagcdn.com/w20/nc.png', name: 'New Caledonia', code: 'NC' },
    { label: '+688', value: '+688', flag: 'https://flagcdn.com/w20/tv.png', name: 'Tuvalu', code: 'TV' },
    { label: '+689', value: '+689', flag: 'https://flagcdn.com/w20/pf.png', name: 'French Polynesia', code: 'PF' },
    { label: '+690', value: '+690', flag: 'https://flagcdn.com/w20/tk.png', name: 'Tokelau', code: 'TK' },
    { label: '+691', value: '+691', flag: 'https://flagcdn.com/w20/fm.png', name: 'Micronesia', code: 'FM' },
    { label: '+692', value: '+692', flag: 'https://flagcdn.com/w20/mh.png', name: 'Marshall Islands', code: 'MH' },
    { label: '+850', value: '+850', flag: 'https://flagcdn.com/w20/kp.png', name: 'North Korea', code: 'KP' },
    { label: '+852', value: '+852', flag: 'https://flagcdn.com/w20/hk.png', name: 'Hong Kong', code: 'HK' },
    { label: '+853', value: '+853', flag: 'https://flagcdn.com/w20/mo.png', name: 'Macau', code: 'MO' },
    { label: '+855', value: '+855', flag: 'https://flagcdn.com/w20/kh.png', name: 'Cambodia', code: 'KH' },
    { label: '+856', value: '+856', flag: 'https://flagcdn.com/w20/la.png', name: 'Laos', code: 'LA' },
    { label: '+880', value: '+880', flag: 'https://flagcdn.com/w20/bd.png', name: 'Bangladesh', code: 'BD' },
    { label: '+886', value: '+886', flag: 'https://flagcdn.com/w20/tw.png', name: 'Taiwan', code: 'TW' },
    { label: '+960', value: '+960', flag: 'https://flagcdn.com/w20/mv.png', name: 'Maldives', code: 'MV' },
    { label: '+961', value: '+961', flag: 'https://flagcdn.com/w20/lb.png', name: 'Lebanon', code: 'LB' },
    { label: '+962', value: '+962', flag: 'https://flagcdn.com/w20/jo.png', name: 'Jordan', code: 'JO' },
    { label: '+963', value: '+963', flag: 'https://flagcdn.com/w20/sy.png', name: 'Syria', code: 'SY' },
    { label: '+964', value: '+964', flag: 'https://flagcdn.com/w20/iq.png', name: 'Iraq', code: 'IQ' },
    { label: '+965', value: '+965', flag: 'https://flagcdn.com/w20/kw.png', name: 'Kuwait', code: 'KW' },
    { label: '+966', value: '+966', flag: 'https://flagcdn.com/w20/sa.png', name: 'Saudi Arabia', code: 'SA' },
    { label: '+967', value: '+967', flag: 'https://flagcdn.com/w20/ye.png', name: 'Yemen', code: 'YE' },
    { label: '+968', value: '+968', flag: 'https://flagcdn.com/w20/om.png', name: 'Oman', code: 'OM' },
    { label: '+970', value: '+970', flag: 'https://flagcdn.com/w20/ps.png', name: 'Palestine', code: 'PS' },
    { label: '+971', value: '+971', flag: 'https://flagcdn.com/w20/ae.png', name: 'United Arab Emirates', code: 'AE' },
    { label: '+972', value: '+972', flag: 'https://flagcdn.com/w20/il.png', name: 'Israel', code: 'IL' },
    { label: '+973', value: '+973', flag: 'https://flagcdn.com/w20/bh.png', name: 'Bahrain', code: 'BH' },
    { label: '+974', value: '+974', flag: 'https://flagcdn.com/w20/qa.png', name: 'Qatar', code: 'QA' },
    { label: '+975', value: '+975', flag: 'https://flagcdn.com/w20/bt.png', name: 'Bhutan', code: 'BT' },
    { label: '+976', value: '+976', flag: 'https://flagcdn.com/w20/mn.png', name: 'Mongolia', code: 'MN' },
    { label: '+977', value: '+977', flag: 'https://flagcdn.com/w20/np.png', name: 'Nepal', code: 'NP' },
    { label: '+992', value: '+992', flag: 'https://flagcdn.com/w20/tj.png', name: 'Tajikistan', code: 'TJ' },
    { label: '+993', value: '+993', flag: 'https://flagcdn.com/w20/tm.png', name: 'Turkmenistan', code: 'TM' },
    { label: '+994', value: '+994', flag: 'https://flagcdn.com/w20/az.png', name: 'Azerbaijan', code: 'AZ' },
    { label: '+995', value: '+995', flag: 'https://flagcdn.com/w20/ge.png', name: 'Georgia', code: 'GE' },
    { label: '+996', value: '+996', flag: 'https://flagcdn.com/w20/kg.png', name: 'Kyrgyzstan', code: 'KG' },
    { label: '+998', value: '+998', flag: 'https://flagcdn.com/w20/uz.png', name: 'Uzbekistan', code: 'UZ' }
  ];

  genderOptions: DropdownOption[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
  ];

  countries: DropdownOption[] = [];
  nationalities: DropdownOption[] = [];
  filteredCountries: DropdownOption[] = [];
  filteredNationalities: DropdownOption[] = [];
  countrySearchText = '';
  nationalitySearchText = '';
  countryCodeSearchText = '';

  get filteredCountryCodes(): CountryCode[] {
    const search = this.countryCodeSearchText.trim().toLowerCase();
    if (!search) return this.countryCodes;
    return this.countryCodes.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.code.toLowerCase().includes(search) ||
      c.label.toLowerCase().includes(search)
    );
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private positionBuilder: OverlayPositionBuilder
  ) {}

  ngOnInit() {
    countries.registerLocale(enLocale);
    this.countries = Object.entries(countries.getNames('en', { select: 'official' })).map(([code, name]) => ({ label: name, value: name }));
    this.nationalities = this.countries.map(c => ({ label: c.label, value: c.label.toLowerCase() }));
    this.filteredCountries = [...this.countries];
    this.filteredNationalities = [...this.nationalities];
    this.initializeForm();
  }

  // Custom Validators based on backend validation
  static nameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const errors: ValidationErrors = {};
    const value = control.value.trim();
    
    // Must contain only letters, spaces, hyphens, and apostrophes
    if (!/^[A-Za-z\s\-']+$/.test(value)) {
      errors['invalidCharacters'] = true;
    }
    
    // Must not start or end with spaces, hyphens, or apostrophes
    if (/^[\s\-']|[\s\-']$/.test(value)) {
      errors['invalidStartEnd'] = true;
    }
    
    // Must not contain consecutive spaces, hyphens, or apostrophes
    if (/[\s\-']{2,}/.test(value)) {
      errors['consecutiveSpecialChars'] = true;
    }
    
    // Must be at least 2 characters long
    if (value.length < 2) {
      errors['tooShort'] = true;
    }
    
    // Must not exceed 50 characters
    if (value.length > 50) {
      errors['tooLong'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  static phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    // Phone number must be in international format: +?[1-9]\d{1,14}
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(control.value)) {
      return { invalidPhone: true };
    }
    return null;
  }

  static passwordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const errors: ValidationErrors = {};
    
    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(control.value)) {
      errors['missingUppercase'] = true;
    }
    
    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(control.value)) {
      errors['missingLowercase'] = true;
    }
    
    // Must contain at least one digit
    if (!/[0-9]/.test(control.value)) {
      errors['missingDigit'] = true;
    }
    
    // Must contain at least one special character
    if (!/[^A-Za-z0-9]/.test(control.value)) {
      errors['missingSpecialChar'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  static genderValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const validGenders = ['male', 'female', 'other', 'prefer not to say'];
    if (!validGenders.includes(control.value.toLowerCase())) {
      return { invalidGender: true };
    }
    return null;
  }

  initializeForm() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, RegisterComponent.nameValidator]],
      lastName: ['', [Validators.required, RegisterComponent.nameValidator]],
      email: ['', [Validators.required, Validators.email]],
      countryCode: ['+91', [Validators.required]], // Default to India
      phone: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      gender: ['', [Validators.required, RegisterComponent.genderValidator]],
      country: ['', [Validators.required]],
      nationality: ['', [Validators.required]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        RegisterComponent.passwordValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  // Helper method to get validation error messages
  getFieldErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        if (errors['required']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`;
        if (errors['invalidCharacters']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name can only contain letters, spaces, hyphens, and apostrophes`;
        if (errors['invalidStartEnd']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name cannot start or end with spaces, hyphens, or apostrophes`;
        if (errors['consecutiveSpecialChars']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name cannot contain consecutive spaces, hyphens, or apostrophes`;
        if (errors['tooShort']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters long`;
        if (errors['tooLong']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name cannot exceed 50 characters`;
        break;
      case 'email':
        if (errors['required']) return 'Email is required';
        if (errors['email']) return 'Please enter a valid email address';
        break;
      case 'phone':
        if (errors['required']) return 'Phone number is required';
        if (errors['invalidPhone']) return 'Phone number must be in valid international format';
        break;
      case 'password':
        if (errors['required']) return 'Password is required';
        if (errors['minlength']) return 'Password must be at least 8 characters long';
        if (errors['missingUppercase']) return 'Password must contain at least one uppercase letter';
        if (errors['missingLowercase']) return 'Password must contain at least one lowercase letter';
        if (errors['missingDigit']) return 'Password must contain at least one digit';
        if (errors['missingSpecialChar']) return 'Password must contain at least one special character';
        break;
      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        if (errors['passwordMismatch']) return 'Passwords do not match';
        break;
      case 'gender':
        if (errors['required']) return 'Gender is required';
        if (errors['invalidGender']) return 'Please select a valid gender';
        break;
      case 'dateOfBirth':
        if (errors['required']) return 'Date of birth is required';
        break;
      case 'country':
        if (errors['required']) return 'Country is required';
        break;
      case 'nationality':
        if (errors['required']) return 'Nationality is required';
        break;
    }
    
    return '';
  }

  getSelectedCountryFlag(): string {
    const selectedCode = this.registerForm.get('countryCode')?.value;
    const country = this.countryCodes.find(c => c.value === selectedCode);
    return country?.flag || this.countryCodes[0].flag;
  }

  getSelectedCountryCode(): CountryCode {
    const selectedCode = this.registerForm.get('countryCode')?.value;
    const country = this.countryCodes.find(c => c.value === selectedCode);
    return country || this.countryCodes[0];
  }

  openCountryCodeDropdown(trigger: EventTarget | null) {
    const triggerEl = trigger as HTMLElement;
    if (!triggerEl) return;
    if (this.countryCodeOverlayRef) {
      this.closeCountryCodeDropdown();
      return;
    }
    const positionStrategy = this.positionBuilder
      .flexibleConnectedTo(triggerEl)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      ]);
    this.countryCodeOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: 'country-code-overlay-panel'
    });
    this.countryCodeOverlayRef.attach(new TemplatePortal(this.countryCodeDropdownPanel, this.vcr));
    this.countryCodeOverlayRef.backdropClick().subscribe(() => this.closeCountryCodeDropdown());
  }
  closeCountryCodeDropdown() {
    if (this.countryCodeOverlayRef) {
      this.countryCodeOverlayRef.dispose();
      this.countryCodeOverlayRef = null;
    }
  }

  selectCountryCode(country: CountryCode) {
    this.registerForm.patchValue({ countryCode: country.value });
  }

  toggleGenderDropdown() {
    this.showGenderDropdown = !this.showGenderDropdown;
    // Close other dropdowns
    this.showCountryFieldDropdown = false;
    this.showNationalityDropdown = false;
  }

  selectGender(option: DropdownOption) {
    this.registerForm.patchValue({ gender: option.value });
    this.showGenderDropdown = false;
  }

  toggleCountryFieldDropdown() {
    this.showCountryFieldDropdown = !this.showCountryFieldDropdown;
    if (this.showCountryFieldDropdown) {
      this.countrySearchText = '';
      this.filterCountries();
    }
    // Close other dropdowns
    this.showGenderDropdown = false;
    this.showNationalityDropdown = false;
  }

  selectCountryField(option: DropdownOption) {
    this.registerForm.patchValue({ country: option.value });
    this.showCountryFieldDropdown = false;
  }

  toggleNationalityDropdown() {
    this.showNationalityDropdown = !this.showNationalityDropdown;
    if (this.showNationalityDropdown) {
      this.nationalitySearchText = '';
      this.filterNationalities();
    }
    // Close other dropdowns
    this.showGenderDropdown = false;
    this.showCountryFieldDropdown = false;
  }

  selectNationality(option: DropdownOption) {
    this.registerForm.patchValue({ nationality: option.value });
    this.showNationalityDropdown = false;
  }

  filterCountries() {
    if (!this.countrySearchText || !this.countrySearchText.trim()) {
      this.filteredCountries = [...this.countries];
    } else {
      const searchTerm = this.countrySearchText.toLowerCase().trim();
      this.filteredCountries = this.countries.filter(country => 
        country.label.toLowerCase().includes(searchTerm)
      );
    }
    // Force change detection
    this.filteredCountries = [...this.filteredCountries];
  }

  filterNationalities() {
    if (!this.nationalitySearchText || !this.nationalitySearchText.trim()) {
      this.filteredNationalities = [...this.nationalities];
    } else {
      const searchTerm = this.nationalitySearchText.toLowerCase().trim();
      this.filteredNationalities = this.nationalities.filter(nationality => 
        nationality.label.toLowerCase().includes(searchTerm)
      );
    }
    // Force change detection
    this.filteredNationalities = [...this.filteredNationalities];
  }



  getSelectedGender(): string {
    const selectedValue = this.registerForm.get('gender')?.value;
    if (!selectedValue) return 'Select Gender';
    const option = this.genderOptions.find(o => o.value === selectedValue);
    return option?.label || 'Select Gender';
  }

  getSelectedCountryField(): string {
    const selectedValue = this.registerForm.get('country')?.value;
    if (!selectedValue) return 'Select Country';
    const option = this.countries.find(o => o.value === selectedValue);
    return option?.label || 'Select Country';
  }

  getSelectedNationality(): string {
    const selectedValue = this.registerForm.get('nationality')?.value;
    if (!selectedValue) return 'Select Nationality';
    const option = this.nationalities.find(o => o.value === selectedValue);
    return option?.label || 'Select Nationality';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Phone input validation - only allow numbers
  onPhoneKeyPress(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow backspace, delete, tab, escape, enter, and arrow keys
    if ([8, 9, 27, 13, 37, 38, 39, 40, 46].indexOf(charCode) !== -1) {
      return;
    }
    // Allow only numbers (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onPhoneInput(event: any) {
    // Remove any non-numeric characters
    const value = event.target.value.replace(/\D/g, '');
    this.registerForm.patchValue({ phone: value });
  }

  onPhonePaste(event: ClipboardEvent) {
    // Prevent default paste behavior
    event.preventDefault();
    
    // Get pasted text and filter out non-numeric characters
    const paste = event.clipboardData?.getData('text') || '';
    const numericOnly = paste.replace(/\D/g, '');
    
    // Update the form control with numeric-only value
    this.registerForm.patchValue({ phone: numericOnly });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Close all dropdowns when clicking outside
    const target = event.target as HTMLElement;
    const isInsideDropdown = target.closest('.custom-dropdown') || target.closest('.country-code-dropdown');
    const isInsideDropdownPanel = target.closest('.dropdown-panel');
    const isInsideSearchInput = target.closest('.search-input');
    
    // Only close dropdowns if click is outside both the dropdown and its panel
    if (!isInsideDropdown && !isInsideDropdownPanel && !isInsideSearchInput) {
      this.showGenderDropdown = false;
      this.showCountryFieldDropdown = false;
      this.showNationalityDropdown = false;
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.loading = true;
      const formValue = this.registerForm.value;
      const dateOfBirth = formValue.dateOfBirth;
      let formattedDate = '';
      if (dateOfBirth instanceof Date) {
        const year = dateOfBirth.getFullYear();
        const month = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
        const day = String(dateOfBirth.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else if (typeof dateOfBirth === 'string') {
        formattedDate = dateOfBirth;
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid Date',
          detail: 'Please select a valid date of birth'
        });
        this.loading = false;
        return;
      }
      if (!formValue.firstName || !formValue.lastName || !formValue.email || 
          !formValue.phone || !formValue.gender || !formValue.country || 
          !formValue.nationality || !formValue.password || !formattedDate) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Incomplete Form',
          detail: 'Please fill in all required fields'
        });
        this.loading = false;
        return;
      }
      // Combine country code with phone number
      const fullPhoneNumber = formValue.countryCode + formValue.phone;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(fullPhoneNumber)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid Phone Number',
          detail: 'Phone number must be in valid international format'
        });
        this.loading = false;
        return;
      }
      const registerData: RegisterRequest = {
        fname: formValue.firstName.trim(),
        lname: formValue.lastName.trim(),
        email: formValue.email.trim().toLowerCase(),
        phone: fullPhoneNumber,
        dateofbirth: formattedDate,
        gender: formValue.gender.toLowerCase(),
        country: formValue.country,
        nationality: formValue.nationality,
        cv_access: false,
        password: formValue.password
      };
      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Registration Successful',
            detail: 'Your account has been created successfully. Please login with your credentials.'
          });
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Registration failed. Please try again.';
          let errorSummary = 'Registration Failed';
          if (error.error && error.error.detail) {
            const detail = error.error.detail;
            if (detail.includes('phone number already exists')) {
              errorMessage = 'This phone number is already registered. Please use a different phone number or try logging in.';
              errorSummary = 'Phone Already Registered';
            } else if (detail.includes('email already exists')) {
              errorMessage = 'This email address is already registered. Please use a different email or try logging in.';
              errorSummary = 'Email Already Registered';
            } else {
              errorMessage = detail;
            }
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          this.messageService.add({
            severity: 'error',
            summary: errorSummary,
            detail: errorMessage
          });
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Validation',
        detail: 'Please correct the errors in the form before submitting'
      });
    }
  }

  onLogin() {
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  anyDropdownOpen(): boolean {
    return this.showGenderDropdown || this.showCountryFieldDropdown || this.showNationalityDropdown;
  }

  closeAllDropdowns() {
    this.showGenderDropdown = false;
    this.showCountryFieldDropdown = false;
    this.showNationalityDropdown = false;
  }
}
