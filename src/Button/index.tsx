import React, { type FC } from 'react';
export interface ButtonProps {
  type?: 'primary' | 'default';
  children?: React.ReactNode;
}

const Button: FC<ButtonProps> = ({ children }) => {
  return (
    <div>
      sss
      {/* <View>xx</View> */}
    </div>
  );
};

export default Button;
