import { useReducer } from 'react';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import MainContent from './Components/MainContent/MainContent';
import AddTask from './Pages/AddTask/AddTask';
import TaskList from './Pages/TaskList/TaskList';
import './App.css';

interface Task {
  id: number;
  name: string;
  completed: boolean;
}

const initialState = { tasks: [] };

function App() {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const addTask = (taskName: string) => {
    dispatch({ type: 'ADD_TASK', payload: taskName });
  };

  const removeTask = (taskId: number) => {
    dispatch({ type: 'REMOVE_TASK', payload: taskId });
  };

  const toggleTask = (taskId: number) => {
    dispatch({ type: 'TOGGLE_TASK', payload: taskId });
  };

  return (
    <div className="app-container">
      <Header />
      <MainContent>
        <h1>Pendências</h1>
        <AddTask onAddTask={addTask} />
        <TaskList tasks={state.tasks} onRemoveTask={removeTask} onToggleTask={toggleTask} />
      </MainContent>
      <Footer />
    </div>
  );
}

export default App;