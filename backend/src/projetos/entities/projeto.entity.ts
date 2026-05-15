import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToMany, CreateDateColumn } from 'typeorm';
import { Evento } from '../../evento/entities/evento.entity';
import { User } from '../../users/entities/user.entity';
import { ProjetoAluno } from './projeto-aluno.entity';
import { ProjetoOrientador } from './projeto-orientador.entity';
import { TemaEvento } from '../../evento/entities/tema-evento.entity';

@Entity('projetos')
@Unique(['alunoAutor', 'evento'])
export class Projeto {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Evento, (evento) => evento.projetos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evento_id' })
  evento!: Evento;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'aluno_autor_id' })
  alunoAutor!: User;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text' })
  descricao!: string;

<<<<<<< Updated upstream
  // Se você for usar a tabela de temas orientadores, o campo seria assim
@ManyToOne(() => TemaEvento)
@JoinColumn({ name: 'tema_id' })
tema!: TemaEvento; 

=======
  @Column({ name: 'tema_id' })
  temaId!: number;
>>>>>>> Stashed changes

  // Relação para carregar o objeto TemaEvento completo (nome, etc.)
  @ManyToOne(() => TemaEvento, { nullable: true, eager: false })
  @JoinColumn({ name: 'tema_id', referencedColumnName: 'id' })
  tema!: TemaEvento;

  @OneToMany(() => ProjetoAluno, (projetoAluno) => projetoAluno.projeto)
  projetoAlunos!: ProjetoAluno[];

  @OneToMany(() => ProjetoOrientador, (projetoOrientador) => projetoOrientador.projeto)
  orientadores!: ProjetoOrientador[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;
}