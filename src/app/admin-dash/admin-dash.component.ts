import { UserService } from './../service/user.service';
import { ProjectService } from './../service/project.service';
import {Component, OnInit} from '@angular/core';
import {RfpService} from '../service/rfp.service';
import {AuthService} from '../service/auth.service';
import {NgxCsvParser} from 'ngx-csv-parser';
import {NgxCSVParserError} from 'ngx-csv-parser';
import { User } from '../user/user.model';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import RFP from '../rfp/rfp.model';
import Project from '../projects/project.model';

@Component({
  selector: 'app-admin-dash',
  templateUrl: './admin-dash.component.html',
  styleUrls: ['./admin-dash.component.css']
})
export class AdminDashComponent implements OnInit {
  showConfirm: boolean = false;
  studentRecords: any[] = [];

  constructor(private userService: UserService,
              private authService: AuthService,
              private ngxCsvParser: NgxCsvParser,
              private rfpService: RfpService,
              private projectService: ProjectService) {
  }

  ngOnInit(): void {
    if (!localStorage.getItem("isLogin") || !(localStorage.getItem("userType") === "admin")) {
      window.location.href = "/";
    }

    this.getActiveUsersFromDB();
    this.getInactiveUsersFromDB();

    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }

  // returns a list of pending RFPs
  getPendingRFPs(): RFP[] {
    return this.rfpService.getRFPs().filter((rfp, index, array) => {
      return rfp.status == 'Pending';
    });
  }

  // Returns a list of projects with status 'Active'
  getActiveProjects(): Project[] {
    return this.projectService.getProjects().filter((project, index, array) => {
      return project.status == 'Active';
    })
  }

  // Returns a list of active users
  getActiveUsersFromDB(): User[] {
    return this.userService.getUsers().filter((user, index, array) => {
      return user.active;
    });
  }

  // Returns a list of inactive users
  getInactiveUsersFromDB(): User[] {
    return this.userService.getUsers().filter((user, index, array) => {
      return !user.active;
    });
  }

  showConfirmButton() {
    this.showConfirm = !this.showConfirm;
  }

  public changeListener(files: FileList) {
    this.studentRecords = [];
    console.log(files);
    if (files && files.length > 0) {
      this.ngxCsvParser.parse(files[0], {header: true, delimiter: ','})
        .pipe().subscribe((result: Array<any>) => {
        console.log('Result', result);
        this.studentRecords = result;
      }, (error: NgxCSVParserError) => {
        console.log('Error', error);
      });
    }
  }

  async batchCreateStudents() {
    try {
      for (let student of this.studentRecords) {
        // generate a random password
        let randomPassword = Math.random().toString(36)
        // TODO: Add users to Team specified in CSV file once teams are implemented
        await this.authService.signupStudent(student['Email'], randomPassword, student['First Name'], student['Last Name'], student['OrgDefindID'], student['Team Leaders'].toLowerCase() == 'true');
        // send password reset email to student
        this.authService.resetPassword(student['Email'])
        console.log(student);
      }
      alert('Students created successfully.');
    } catch(exception: any) {
      alert('An error occurred. Failed to create students.');
    } finally {
      this.studentRecords = [];
      this.showConfirm = false;
      this.ngOnInit();
    }
  }

  generatePDF(rfp: RFP): void {
    const docDefinition = this.rfpService.getDocumentDefinition(rfp);
    pdfMake.createPdf(docDefinition).open();
  }

  // Set an RFP's status to approved and make it a project
  ApproveRFP(rfp: RFP): void {
    // approve RFP
    this.rfpService.updateRFP(rfp, {status: 'Approved'});
    // create project out of RFP
    this.projectService.createProject(rfp);
  }

  // Set an RFP's status to rejected
  RejectRFP(rfp: RFP): void {
    this.rfpService.updateRFP(rfp, {status: 'Rejected'});
  }

  toggleEditLinkTextbox(index: number): void {
    let editSection = <HTMLElement>document.getElementsByClassName("editLink").item(index);
    let viewSection = <HTMLElement>document.getElementsByClassName("viewLink").item(index);

    // if the edit section is hidden
    if (editSection.style.display == 'none') {
      // show the edit section
      editSection.style.display = 'block';
      // hide the link
      viewSection.style.display = 'none';
    } else {
      // hide the edit section
      editSection.style.display = 'none';
      // show the link
      viewSection.style.display = 'block';
      // reset the textbox's value
      (<HTMLInputElement>document.getElementsByClassName("editLinkTextbox").item(index)).value = '';
    }
  }

  editAzureLink(index: number, project: Project): void {
    // get new link from textbox
    let newLink = (<HTMLInputElement>document.getElementsByClassName("editLinkTextbox").item(index)).value;

    if (newLink != '') {
      // update the project
      this.projectService.updateProject(project, {azureLink: newLink});
    }

    // hide the edit section
    this.toggleEditLinkTextbox(index);
  }
}
