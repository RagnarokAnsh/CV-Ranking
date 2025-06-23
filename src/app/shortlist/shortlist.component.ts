import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

// Navbar Component Import
import { NavbarComponent } from '../shared/navbar/navbar.component';

interface CV {
  id: string;
  name: string;
  nationality: string;
  experience: number;
  age: number;
  qualification: string;
  selected?: boolean;
}

interface FilterOption {
  label: string;
  value: string;
}

interface EmploymentHistory {
  id: string;
  name: string;
  details: string;
}

@Component({
  selector: 'app-shortlist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DropdownModule,
    SliderModule,
    FileUploadModule,
    CardModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    AccordionModule,
    InputTextModule,
    NavbarComponent
  ],
  providers: [MessageService],
  templateUrl: './shortlist.component.html',
  styleUrls: ['./shortlist.component.scss']
})
export class ShortlistComponent implements OnInit {
  // Mock CV Data - These would come from the longlist component
  cvs: CV[] = [
    { id: 'CV001', name: 'Patel Singh', nationality: 'Indian', experience: 4, age: 28, qualification: 'Masters Degree' },
    { id: 'CV002', name: 'Sushil Shrestha', nationality: 'Nepali', experience: 5, age: 30, qualification: 'Masters Degree' },
    { id: 'CV003', name: 'Rohit Jaiswal', nationality: 'Indian', experience: 4, age: 28, qualification: 'Bachelor Degree' }
  ];

  filteredCvs: CV[] = [];

  // Job Description Template Options
  jobDescriptionTemplates = [
    { label: 'UNV Template', value: 'unv' },
    { label: 'SC Template', value: 'sc' },
    { label: 'SC Manager Template', value: 'sc_manager' },
    { label: 'IC Consultant Template', value: 'ic_consultant' }
  ];

  // Search Operator Options
  searchOperatorOptions = [
    { label: 'AND', value: 'and' },
    { label: 'OR', value: 'or' }
  ];

  // Filter Values
  selectedJobTemplate: string = 'unv';
  searchQuery: string = '';
  selectedSearchOperator: string = 'and';
  
  // Weight values (must add up to 1.0)
  weightExperience: number = 0.30;
  weightQualifications: number = 0.40;
  weightSkills: number = 0.30;
  
  // Validation
  weightValidationError: string = '';

  // Selected filters from longlist (these would come from a service)
  selectedMinYearsExperience: number = 0;
  selectedRequiredDegree: string = 'Any';
  selectedGenderFilter: string = 'Any';

  // Job Description
  jobDescription: string = 'Extracted Section';
  jobDescriptionContent: string = `FUNCTIONS / KEY RESULTS EXPECTED:
Duties and Responsibilities:  
h
Within delegated authority, and in close cooperation with the Head – Technology and Solution, the 
Software Development  Associate will be responsible for the following duties: `;

  // Employment History
  employmentHistory: EmploymentHistory[] = [
    {
      id: 'CV 2',
      name: 'Sushil Kumar',
      details: `Employment History Of CV 2 - Sushil Kumar

Detail Description Of Duties: Assistant Manager IT

Results And Achievements: Currently Heading An IT Team For The Software/Mobile Application Development. Responsible For Software Development Projects Across Multiple Technologies (In-House Or Through Vendors) For Building New Capabilities, Driving Automation And Improve Operational Efficiencies. Formulates And Defines Specifications For Complex Operating Software Programming Applications, Including Commercial Applications. Drives Research, Development, Testing And Implementation Of Software Applications Or Specialized Utility Programs Using Current Programming Languages And Source Code To Support End Users' Needs. Performs Regular Updates And Recommends Improvement To Existing Applications Using Engineering Releases And Utilities. Establishes Technology Standards For Applications Development And Is Also Responsible For Software Quality Assurance By Reviewing Process Compliances, Identifying Pain Points, And Driving Improvement Initiatives.

Detail Description Of Duties: Worked As A Project Associate With Scientist For The Betterment Of Society`
    },
    {
      id: 'CV 20',
      name: 'Jeslin Jerome',
      details: `Employment History Of CV 20 - Jeslin Jerome

Detail Description Of Duties: Software Developer

Results And Achievements: Experienced in full-stack development with expertise in modern web technologies. Led multiple development teams in creating scalable applications. Specialized in React, Node.js, and cloud technologies.`
    },
    {
      id: 'CV 30',
      name: 'Siddharth Patel',
      details: `Employment History Of CV 30 - Siddharth Patel

Detail Description Of Duties: Senior Software Engineer

Results And Achievements: Developed and maintained enterprise-level applications. Expertise in system architecture and database design. Led cross-functional teams in delivering high-quality software solutions.`
    },
    {
      id: 'CV 34',
      name: 'Avinash Tripathi',
      details: `Employment History Of CV 34 - Avinash Tripathi

Detail Description Of Duties: Technical Lead

Results And Achievements: Managed technical teams and project deliverables. Specialized in microservices architecture and DevOps practices. Implemented CI/CD pipelines and improved development workflows.`
    }
  ];

  // Ranking Results
  rankingResults = [
    { rank: 1, cvId: 'CV5', name: 'Piyush Singh', highestDegree: 'Masters Degree', yoe: 4, finalScore: 0.8555, gender: 'Male', nationality: 'Indian' },
    { rank: 2, cvId: 'CV14', name: 'Vivek Mathur', highestDegree: 'Masters Degree', yoe: 3, finalScore: 0.8465, gender: 'Male', nationality: 'Nepali' },
    { rank: 3, cvId: 'CV20', name: 'Jeslin Jerome', highestDegree: 'Masters Degree', yoe: 4, finalScore: 0.8234, gender: 'Male', nationality: 'Indian' }
  ];

  constructor(private messageService: MessageService) {
    console.log('ShortlistComponent constructor called');
  }

  ngOnInit() {
    console.log('ShortlistComponent ngOnInit called');
    this.filteredCvs = [...this.cvs];
    this.validateWeights();
    console.log('Shortlist component initialized with', this.cvs.length, 'CVs');
  }

  // Weight adjustment methods
  adjustWeight(field: string, increment: boolean) {
    const adjustment = increment ? 0.10 : -0.10;
    
    switch (field) {
      case 'experience':
        this.weightExperience = Math.max(0, Math.min(1, this.weightExperience + adjustment));
        break;
      case 'qualifications':
        this.weightQualifications = Math.max(0, Math.min(1, this.weightQualifications + adjustment));
        break;
      case 'skills':
        this.weightSkills = Math.max(0, Math.min(1, this.weightSkills + adjustment));
        break;
    }
    
    // Round to 2 decimal places to avoid floating point issues
    this.weightExperience = Math.round(this.weightExperience * 100) / 100;
    this.weightQualifications = Math.round(this.weightQualifications * 100) / 100;
    this.weightSkills = Math.round(this.weightSkills * 100) / 100;
    
    this.validateWeights();
  }

  // Validate that weights add up to 1.0
  validateWeights() {
    const total = this.weightExperience + this.weightQualifications + this.weightSkills;
    const roundedTotal = Math.round(total * 100) / 100;
    
    if (roundedTotal !== 1.0) {
      this.weightValidationError = `Total weight must equal 1.0 (current: ${roundedTotal.toFixed(2)})`;
    } else {
      this.weightValidationError = '';
    }
  }

  // Submit ranking
  submitRanking() {
    if (this.weightValidationError) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: this.weightValidationError
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Ranking Submitted',
      detail: 'CV ranking has been submitted successfully'
    });
  }

  // Reset ranking
  resetRanking() {
    this.weightExperience = 0.30;
    this.weightQualifications = 0.40;
    this.weightSkills = 0.30;
    this.selectedJobTemplate = 'unv';
    this.selectedSearchOperator = 'and';
    this.searchQuery = '';
    this.validateWeights();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Ranking Reset',
      detail: 'All ranking parameters have been reset'
    });
  }

  // Upload job description
  onJobDescriptionUpload(event: any) {
    const files = event.files;
    if (files && files.length > 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Job Description Uploaded',
        detail: `${files.length} file(s) uploaded successfully`
      });
    }
  }
}
