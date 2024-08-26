import React, { useState } from "react";
import styled from "styled-components";

interface AddTaskProps {
    onAddTask: (taskName: string)=> void;
}

const Form = styled.form`
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    width: 50ww;
`;

const Input = styled.input`
    flex: 1;
    padding: 10px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-right: 10px;
`;

const Button = styled.button`
    padding: 10px 20px;
    font-size: 16px;
    background-color: #ed145b;
    color: white;
    border: none;
    border-radius: 4px;
`;

const AddTask: React.FC<AddTaskProps> = ({ onAddTask }) => {
    const [taskName, setTaskName] = useState('');
    const handleSubmit =  (e: React.FormEvent) =>{
        e.preventDefault();
        onAddTask(taskName);
        setTaskName(''); //Limpeza do campo 
    };
    return (
        <form onSubmit={handleSubmit} className='add-task-form'> 
            <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Adiciona uma nova tarefa"
                className="add-task-input"
                />
            <button type="submit" className='add-task-button'>Adicionar</button>
        </form>
    );
}

export default AddTask;