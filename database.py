
import sqlite3    
from datetime import datetime

ARQUIVO_BANCO = 'financeboard.db'


def conectar():
   
    conn = sqlite3.connect(ARQUIVO_BANCO)
    conn.row_factory = sqlite3.Row   
    return conn


def criar_tabelas():
    
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transacoes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao   TEXT    NOT NULL,
            valor       REAL    NOT NULL,
            tipo        TEXT    NOT NULL CHECK(tipo IN ('entrada', 'saida')),
            categoria   TEXT    NOT NULL,
            data        TEXT    NOT NULL,
            criado_em   TEXT    DEFAULT (datetime('now', 'localtime'))
        )
    ''')
    

    conn.commit()   
    conn.close()    


def inserir_transacao(descricao, valor, tipo, categoria, data):
    
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO transacoes (descricao, valor, tipo, categoria, data)
        VALUES (?, ?, ?, ?, ?)
    ''', (descricao, valor, tipo, categoria, data))

    id_gerado = cursor.lastrowid   
    conn.commit()
    conn.close()

    return id_gerado


def buscar_todas_transacoes():
    
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT id, descricao, valor, tipo, categoria, data
        FROM transacoes
        ORDER BY data DESC, criado_em DESC
    ''')

    linhas = cursor.fetchall()   
    conn.close()

    
    return [dict(linha) for linha in linhas]


def deletar_transacao(id):
    
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM transacoes WHERE id = ?', (id,))
    
    linhas_afetadas = cursor.rowcount   
    conn.commit()
    conn.close()

    return linhas_afetadas > 0   


def calcular_resumo():
   
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("SELECT COALESCE(SUM(valor), 0) FROM transacoes WHERE tipo = 'entrada'")
    total_entradas = cursor.fetchone()[0]


    cursor.execute("SELECT COALESCE(SUM(valor), 0) FROM transacoes WHERE tipo = 'saida'")
    total_saidas = cursor.fetchone()[0]

   
    saldo = total_entradas - total_saidas

    cursor.execute('''
        SELECT categoria, SUM(valor) as total
        FROM transacoes
        WHERE tipo = 'saida'
        GROUP BY categoria
        ORDER BY total DESC
    ''')
    por_categoria = [dict(row) for row in cursor.fetchall()]

    cursor.execute('''
        SELECT
            data,
            SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) as variacao
        FROM transacoes
        GROUP BY data
        ORDER BY data ASC
    ''')
    dias = cursor.fetchall()
    
    
    historico_diario = []
    saldo_acumulado = 0
    for dia in dias:
        saldo_acumulado += dia['variacao']
        historico_diario.append({
            'data': dia['data'],
            'saldo': round(saldo_acumulado, 2)
        })

    conn.close()

    return {
        'saldo': round(saldo, 2),
        'total_entradas': round(total_entradas, 2),
        'total_saidas': round(total_saidas, 2),
        'por_categoria': por_categoria,
        'historico_diario': historico_diario
    }
