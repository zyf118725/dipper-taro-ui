import React, { type FC } from 'react';
// import { View } from '@tarojs/components';

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
