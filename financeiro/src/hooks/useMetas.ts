import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Meta, AporteMeta } from '../types';
import { useGamificacao } from './useGamificacao';

export function useMetas() {
  const { registrarAcao, desbloquearConquista } = useGamificacao();

  const metas = useLiveQuery(() =>
    db.metas.filter(m => m.ativa).toArray()
  ) ?? [];

  const aportes = useLiveQuery(() => db.aportesMeta.toArray()) ?? [];

  async function adicionarMeta(dados: Omit<Meta, 'id'>) {
    await db.metas.add(dados as Meta);
  }

  async function editarMeta(id: number, dados: Partial<Meta>) {
    await db.metas.update(id, dados);
  }

  async function arquivarMeta(id: number) {
    await db.metas.update(id, { ativa: false });
  }

  async function adicionarAporte(dados: Omit<AporteMeta, 'id'>) {
    await db.aportesMeta.add(dados as AporteMeta);
    const meta = await db.metas.get(dados.metaId);
    if (meta?.id) {
      const novosAportes = await db.aportesMeta
        .where('metaId').equals(dados.metaId).toArray();
      const total = novosAportes.reduce((s, a) => s + a.valor, 0);
      await db.metas.update(meta.id, { valorGuardado: total });

      if (total >= meta.valorTotal) {
        await registrarAcao('meta_atingida');
        await desbloquearConquista('meta_batida');
      }
    }
  }

  async function removerAporte(id: number) {
    const aporte = await db.aportesMeta.get(id);
    await db.aportesMeta.delete(id);
    if (aporte) {
      const aportesMeta = await db.aportesMeta
        .where('metaId').equals(aporte.metaId).toArray();
      const total = aportesMeta.reduce((s, a) => s + a.valor, 0);
      await db.metas.update(aporte.metaId, { valorGuardado: total });
    }
  }

  function getAportesDaMeta(metaId: number) {
    return aportes.filter(a => a.metaId === metaId);
  }

  return {
    metas,
    aportes,
    adicionarMeta,
    editarMeta,
    arquivarMeta,
    adicionarAporte,
    removerAporte,
    getAportesDaMeta,
  };
}
