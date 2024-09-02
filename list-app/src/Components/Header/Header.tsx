import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  display: flex;
  background-color: #ed145b;
  color: white;
  justify-content: center;
  padding: 20px;
`;

const HeaderTitle = styled.h1`
  text-align: center;
`;

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <HeaderTitle>Lista de Tarefas</HeaderTitle>
    </HeaderContainer>
  );
};

export default Header;