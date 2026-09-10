export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(data: string): string {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function mesNome(mes: number): string {
  return new Date(2024, mes - 1, 1).toLocaleString('pt-BR', { month: 'long' });
}

export function mesNomeCurto(mes: number): string {
  return new Date(2024, mes - 1, 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
}

export function dataHoje(): string {
  return new Date().toISOString().split('T')[0];
}

export function mesAtual(): number {
  return new Date().getMonth() + 1;
}

export function anoAtual(): number {
  return new Date().getFullYear();
}

export function inicioDoMes(): boolean {
  return new Date().getDate() <= 5;
}
