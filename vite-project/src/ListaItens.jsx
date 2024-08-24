import React, { useState } from 'react';

function ListaItens() {
    const [itens, setItens] = useState([]);
    const [novoItens, setNovoItem] = useState('');

    const adcionarItem = () => {
        if(!novoItens) return;
        setItens([...itens, novoItens]);
        setNovoItem('');
    };

    const removerItem = (indice) => {
        setItens(itens.filter((_, index) => index !== indice));
    };

    return (
        <div>
          <h2>Lista de Itens</h2>
          <input
            type="text"
            value={novoItens}
            onChange={(e) => setNovoItem(e.target.value)}
            />
            <button onClick={adcionarItem}>Adicionar Item</button>
            <ul>
                {itens.map((item, index) => (
                    <li key={index}>
                        {item} <button onClick={() => removerItem(index)}>Remover</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ListaItens;