import { Component, OnInit } from '@angular/core';

import Project from '../projects/project.model';
import { ProjectService } from '../service/project.service';

@Component({
  selector: 'app-student-dash',
  templateUrl: './student-dash.component.html',
  styleUrls: ['./student-dash.component.css']
})
export class StudentDashComponent implements OnInit {
  uid: string;

  constructor(private projectService: ProjectService) { }

  ngOnInit(): void {
    if (!localStorage.getItem("isLogin") || !(localStorage.getItem("userType") === "student")) {
      window.location.href = "/";
    }

    this.uid = localStorage['uid']; // get id of currently logged-in student
  }

  getProjects(): Project[] {
    return this.projectService.getProjects();
  }

  getMyPastProjects(): Project[] {
    return this.projectService.getProjectsByUID(this.uid).filter((project, index, array) => {
      return project.status == 'Completed';
    });
  }

  getMyActiveProjects(): Project[] {
    return this.projectService.getProjectsByUID(this.uid).filter((project, index, array) => {
      return project.status == 'Active';
    });
  }
}
