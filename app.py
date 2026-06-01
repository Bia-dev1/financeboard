from flask import Flask, request, jsonify   
from flask_cors import CORS                  
import database                              

app = Flask(__name__)

CORS(app)

database.criar_tabelas()

@app.route('/api/transacoes', methods=['GET'])
def listar_transacoes():
    transacoes = database.buscar_todas_transacoes()
    return jsonify(transacoes)


@app.route('/api/transacoes', methods=['POST'])
def adicionar_transacao():
    dados = request.get_json()   

    campos_obrigatorios = ['descricao', 'valor', 'tipo', 'categoria', 'data']
    for campo in campos_obrigatorios:
        if campo not in dados:
            return jsonify({'erro': f'Campo obrigatório ausente: {campo}'}), 400

    
    if dados['tipo'] not in ['entrada', 'saida']:
        return jsonify({'erro': 'Tipo deve ser "entrada" ou "saida"'}), 400

    try:
        valor = float(dados['valor'])
        if valor <= 0:
            raise ValueError()
    except ValueError:
        return jsonify({'erro': 'Valor deve ser um número positivo'}), 400

    nova_id = database.inserir_transacao(
        descricao=dados['descricao'],
        valor=valor,
        tipo=dados['tipo'],
        categoria=dados['categoria'],
        data=dados['data']
    )

    return jsonify({'mensagem': 'Transação adicionada com sucesso', 'id': nova_id}), 201


@app.route('/api/transacoes/<int:id>', methods=['DELETE'])
def deletar_transacao(id):
    removida = database.deletar_transacao(id)

    if not removida:
        return jsonify({'erro': 'Transação não encontrada'}), 404

    return jsonify({'mensagem': 'Transação removida com sucesso'})


@app.route('/api/resumo', methods=['GET'])
def obter_resumo():
    resumo = database.calcular_resumo()
    return jsonify(resumo)


if __name__ == '__main__':
    print("🚀 FinanceBoard rodando em http://localhost:5000")
    app.run(debug=True, port=5000)
