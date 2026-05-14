import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Projeto } from 'src/projetos/entities/projeto.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { User } from 'src/users/entities/user.entity';

// Value Object ajustado para apenas DATA
export class Periodo {
  @Column({ type: 'date', nullable: true }) // Mudança para 'date'
  inicio?: Date;

  @Column({ type: 'date', nullable: true }) // Mudança para 'date'
  fim?: Date;
}

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  // --- Prazos de Ciclo de Vida ---
  @Column(() => Periodo)
  inscricao!: Periodo;

  @Column(() => Periodo)
  submissao!: Periodo;

  @Column(() => Periodo)
  avaliacao!: Periodo;

  @Column(() => Periodo)
  aceitacao!: Periodo;

  // --- Configurações Gerais ---
  @Column({ name: 'coordenador_id', nullable: true })
  coordenadorId?: number;

@Column({ name: 'prazo_inicial', type: 'date', nullable: true }) // Adicione o nullable aqui
prazoInicial!: Date;

@Column({ name: 'prazo_final', type: 'date', nullable: true }) // Adicione o nullable aqui
prazoFinal!: Date;

  // Mantemos datetime para auditoria (saber o segundo exato da criação)
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => User) 
  @JoinColumn({ name: 'coordenador_id' })
  coordenador!: User;

  @OneToMany(() => Projeto, (projeto) => projeto.evento)
  projetos!: Projeto[];

  @OneToMany(() => TemaEvento, (tema) => tema.evento)
  temas!: TemaEvento[];
}
