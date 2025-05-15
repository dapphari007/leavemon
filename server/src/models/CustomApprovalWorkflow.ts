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
  })
  category: ApprovalCategory;

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