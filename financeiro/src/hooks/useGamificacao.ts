import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { NIVEIS, CONQUISTAS } from '../types';
import { format } from 'date-fns';

const XP_ACOES: Record<string, number> = {
  lancamento: 10,
  streak_3_dias: 50,
  mes_positivo: 100,
  meta_atingida: 200,
  gastos_fixos: 30,
};

export function useGamificacao() {
  const estado = useLiveQuery(() => db.gamificacao.toCollection().first());

  function calcularNivel(xp: number) {
    for (let i = NIVEIS.length - 1; i >= 0; i--) {
      if (xp >= NIVEIS[i].xpMin) return NIVEIS[i].nivel;
    }
    return 1;
  }

  function getNivelInfo(nivel: number) {
    return NIVEIS.find(n => n.nivel === nivel) ?? NIVEIS[0];
  }

  async function registrarAcao(acao: string) {
    const estado = await db.gamificacao.toCollection().first();
    if (!estado?.id) return;

    const xpGanho = XP_ACOES[acao] ?? 0;
    const hoje = format(new Date(), 'yyyy-MM-dd');
    let novoStreak = estado.streakDias;
    let bonusXp = 0;

    if (acao === 'lancamento') {
      if (estado.ultimoRegistro !== hoje) {
        const ontem = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
        novoStreak = estado.ultimoRegistro === ontem ? estado.streakDias + 1 : 1;
        if (novoStreak % 3 === 0) bonusXp = XP_ACOES.streak_3_dias;
      }
    }

    const novoXp = estado.xp + xpGanho + bonusXp;
    const novoNivel = calcularNivel(novoXp);
    const novasConquistas = [...estado.conquistas];

    if (novoStreak >= 7 && !novasConquistas.includes('primeira_semana')) {
      novasConquistas.push('primeira_semana');
    }

    await db.gamificacao.update(estado.id, {
      xp: novoXp,
      nivel: novoNivel,
      streakDias: novoStreak,
      ultimoRegistro: acao === 'lancamento' ? hoje : estado.ultimoRegistro,
      conquistas: novasConquistas,
    });
  }

  async function desbloquearConquista(id: string) {
    const estado = await db.gamificacao.toCollection().first();
    if (!estado?.id || estado.conquistas.includes(id)) return;
    await db.gamificacao.update(estado.id, {
      conquistas: [...estado.conquistas, id],
    });
  }

  return {
    estado,
    NIVEIS,
    CONQUISTAS,
    calcularNivel,
    getNivelInfo,
    registrarAcao,
    desbloquearConquista,
  };
}
