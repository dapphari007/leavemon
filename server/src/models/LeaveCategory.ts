import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { CustomApprovalWorkflow } from "./CustomApprovalWorkflow";

@Entity("leave_categories")
export class LeaveCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column({ type: "float", default: 0.5 })
  defaultMinDays: number;

  @Column({ type: "float", default: 1 })
  defaultMaxDays: number;

  @Column({ default: 3 })
  maxApprovalLevels: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CustomApprovalWorkflow, workflow => workflow.leaveCategory)
  workflows: CustomApprovalWorkflow[];
}