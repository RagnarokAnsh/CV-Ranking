import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LonglistComponent } from './longlist.component';

describe('LonglistComponent', () => {
  let component: LonglistComponent;
  let fixture: ComponentFixture<LonglistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LonglistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LonglistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
