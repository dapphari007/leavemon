import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Department } from "./Department";
import { Position } from "./Position";
import { LeaveCategory } from "./LeaveCategory";

// Keep for backward compatibility
export enum ApprovalCategory {
  SHORT_LEAVE = "short_leave",
  MEDIUM_LEAVE = "medium_leave",
  LONG_LEAVE = "long_leave",
}

@Entity("custom_approval_workflows")
export class CustomApprovalWorkflow {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: ApprovalCategory,
    enumName: "approval_category_enum",
    nullable: true,
  })
  category: ApprovalCategory;
  
  @Column({ nullable: true })
  leaveCategoryId: string;

  @ManyToOne(() => LeaveCategory, category => category.workflows, { nullable: true })
  @JoinColumn({ name: "leaveCategoryId" })
  leaveCategory: LeaveCategory;

  @Column({ type: "float" })
  minDays: number;

  @Column({ type: "float" })
  maxDays: number;

  @Column({ nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: "departmentId" })
  department: Department;

  @Column({ nullable: true })
  positionId: string;

  @ManyToOne(() => Position, { nullable: true })
  @JoinColumn({ name: "positionId" })
  position: Position;

  @Column({ type: "jsonb" })
  approvalLevels: {
    level: number;
    positionId?: string;
    departmentId?: string;
    isRequired: boolean;
  }[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}