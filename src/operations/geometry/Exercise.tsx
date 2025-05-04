import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Square, Triangle, Hexagon, ArrowLeft, ArrowRight, Eye, RotateCcw, Eye as EyeIcon } from 'lucide-react';
import { toast } from 'sonner';

// Constants
const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;
const CORRECT_STREAK_THRESHOLD = 3; // Aciertos para subir de nivel
const FACTOR_ACTIVATION_THRESHOLD = 5; // Aciertos para activar factores

// Tipos de formas y niveles de dificultad
type Shape = 'circle' | 'square' | 'triangle' | 'rectangle' | 'hexagon';
type MainLevel = 1 | 2 | 3 | 4 | 5; // Nivel principal
type SubLevel = 1 | 2 | 3 | 4 | 5; // Subnivel dentro de cada nivel

// Estructura para nivel completo
interface LevelInfo {
  mainLevel: MainLevel;
  subLevel: SubLevel;
}

// Función para formatear nivel para visualización
const formatLevel = (levelInfo: LevelInfo): string => {
  return `${levelInfo.mainLevel}.${levelInfo.subLevel}`;
};

interface ShapeData {
  name: string;
  icon: React.ReactNode;
  inputs: string[];
  calculate: (values: number[], useFactors: boolean, levelInfo: LevelInfo) => {
    area: number;
    perimeter: number;
  };
  formulas: (useFactors: boolean, levelInfo: LevelInfo) => {
    area: string;
    perimeter: string;
  };
  level: MainLevel;
  getDefaultValues: (subLevel: SubLevel) => number[];
}

// Función para generar un valor aleatorio entre un mínimo y máximo
const getRandomValue = (min: number, max: number, isInteger: boolean = true): number => {
  const random = Math.random() * (max - min) + min;
  return isInteger ? Math.floor(random) : Number(random.toFixed(1));
};

// Función para generar valores triangulares válidos
const generateValidTriangleValues = (subLevel: SubLevel): [number, number, number, number] => {
  let base, height, side2, side3;
  
  switch(subLevel) {
    case 1: // Triángulo isósceles (dos lados iguales)
      base = getRandomValue(3, 8);
      height = getRandomValue(2, 6);
      side2 = getRandomValue(4, 7);
      side3 = side2; // Igual a side2 para ser isósceles
      break;
      
    case 2: // Triángulo rectángulo (uno con proporciones 3-4-5)
      const scale = getRandomValue(1, 3);
      base = 3 * scale;
      height = 4 * scale;
      side2 = 5 * scale;
      side3 = base;
      break;
      
    case 3: // Triángulo escaleno (todos los lados diferentes)
      base = getRandomValue(5, 9);
      height = getRandomValue(4, 7);
      side2 = getRandomValue(6, 9);
      side3 = getRandomValue(7, 10);
      // Asegurar que cumpla la desigualdad triangular
      while (side2 + side3 <= base || base + side2 <= side3 || base + side3 <= side2) {
        side2 += 1;
        side3 += 1;
      }
      break;
      
    case 4: // Triángulo obtusángulo
      base = getRandomValue(7, 12);
      height = getRandomValue(3, 6);
      side2 = getRandomValue(6, 9);
      side3 = getRandomValue(10, 15); // Lado más largo para garantizar ángulo obtuso
      break;
      
    case 5: // Triángulo acutángulo
      base = getRandomValue(5, 8);
      height = getRandomValue(6, 10);
      side2 = getRandomValue(7, 9);
      side3 = getRandomValue(7, 9);
      break;
      
    default:
      base = 5;
      height = 4;
      side2 = 6;
      side3 = 6;
  }
  
  return [base, height, side2, side3];
};

const shapes: Record<Shape, ShapeData> = {
  square: {
    name: 'Square',
    icon: <Square className="w-8 h-8" />,
    inputs: ['Side'],
    calculate: ([side], useFactors, levelInfo) => {
      // Factor varía según el subnivel para incrementar complejidad
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      
      return {
        area: side * side * factor,
        perimeter: 4 * side * factor
      };
    },
    formulas: (useFactors, levelInfo) => {
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      const factorText = useFactors ? ` × ${factor.toFixed(2)}` : '';
      
      return {
        area: `A = s²${factorText}`,
        perimeter: `P = 4s${factorText}`
      };
    },
    level: 1,
    getDefaultValues: (subLevel) => {
      // Valores que se vuelven más complejos con cada subnivel
      switch(subLevel) {
        case 1: return [getRandomValue(2, 4)];
        case 2: return [getRandomValue(4, 6)];
        case 3: return [getRandomValue(5, 8)];
        case 4: return [getRandomValue(6, 10)];
        case 5: return [getRandomValue(8, 12)];
        default: return [3];
      }
    }
  },
  rectangle: {
    name: 'Rectangle',
    icon: <Square className="w-8 h-8" />,
    inputs: ['Length', 'Width'],
    calculate: ([length, width], useFactors, levelInfo) => {
      // Factor específico para cada subnivel
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      
      return {
        area: length * width * factor,
        perimeter: 2 * (length + width) * factor
      };
    },
    formulas: (useFactors, levelInfo) => {
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      const factorText = useFactors ? ` × ${factor.toFixed(2)}` : '';
      
      return {
        area: `A = l × w${factorText}`,
        perimeter: `P = 2(l + w)${factorText}`
      };
    },
    level: 1,
    getDefaultValues: (subLevel) => {
      // Diferentes combinaciones de largo/ancho según el subnivel
      switch(subLevel) {
        case 1: return [getRandomValue(3, 5), getRandomValue(2, 4)];
        case 2: return [getRandomValue(5, 7), getRandomValue(3, 5)];
        case 3: return [getRandomValue(6, 9), getRandomValue(4, 6)];
        case 4: return [getRandomValue(8, 12), getRandomValue(5, 7)];
        case 5: return [getRandomValue(10, 15), getRandomValue(6, 9)];
        default: return [4, 3];
      }
    }
  },
  triangle: {
    name: 'Triangle',
    icon: <Triangle className="w-8 h-8" />,
    inputs: ['Base', 'Height', 'Side 2', 'Side 3'],
    calculate: ([base, height, side2, side3], useFactors, levelInfo) => {
      // Factor específico para cada subnivel
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      
      // Fórmulas adicionales para triángulos según el subnivel
      let area = (base * height) / 2;
      let perimeter = base + side2 + side3;
      
      // En subniveles avanzados, podemos usar fórmulas más complejas
      if (levelInfo.subLevel >= 4) {
        // Para subnivel 4-5, usamos la fórmula de Herón para calcular el área
        // (solo para mostrar complejidad, aunque matemáticamente debería dar lo mismo)
        const s = perimeter / 2;
        area = Math.sqrt(s * (s - base) * (s - side2) * (s - side3));
      }
      
      return {
        area: area * factor,
        perimeter: perimeter * factor
      };
    },
    formulas: (useFactors, levelInfo) => {
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      const factorText = useFactors ? ` × ${factor.toFixed(2)}` : '';
      
      // Fórmula varía según el subnivel
      let areaFormula = 'A = (b × h) ÷ 2';
      
      if (levelInfo.subLevel >= 4) {
        areaFormula = 'A = √[s(s-a)(s-b)(s-c)]'; // Fórmula de Herón
      }
      
      return {
        area: `${areaFormula}${factorText}`,
        perimeter: `P = a + b + c${factorText}`
      };
    },
    level: 2,
    getDefaultValues: (subLevel) => {
      // Usando la función para generar triángulos válidos según el subnivel
      return generateValidTriangleValues(subLevel);
    }
  },
  circle: {
    name: 'Circle',
    icon: <Circle className="w-8 h-8" />,
    inputs: ['Radius'],
    calculate: ([radius], useFactors, levelInfo) => {
      // Factor específico para cada subnivel
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      
      // Para niveles superiores, podemos incluir decimales
      const pi = levelInfo.subLevel >= 4 ? Math.PI : 3.14;
      
      return {
        area: pi * radius * radius * factor,
        perimeter: 2 * pi * radius * factor
      };
    },
    formulas: (useFactors, levelInfo) => {
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      const factorText = useFactors ? ` × ${factor.toFixed(2)}` : '';
      
      // Pi más preciso en subniveles superiores
      const piSymbol = levelInfo.subLevel >= 4 ? 'π' : '3.14';
      
      return {
        area: `A = ${piSymbol}r²${factorText}`,
        perimeter: `P = 2${piSymbol}r${factorText}`
      };
    },
    level: 3,
    getDefaultValues: (subLevel) => {
      // Diferentes valores de radio según subnivel
      // Introducción de decimales en los niveles superiores
      switch(subLevel) {
        case 1: return [getRandomValue(2, 4)];
        case 2: return [getRandomValue(3, 5)];
        case 3: return [getRandomValue(4, 7)];
        case 4: return [getRandomValue(5, 8, false)]; // Con decimales
        case 5: return [getRandomValue(7, 10, false)]; // Con decimales
        default: return [3];
      }
    }
  },
  hexagon: {
    name: 'Regular Hexagon',
    icon: <Hexagon className="w-8 h-8" />,
    inputs: ['Side'],
    calculate: ([side], useFactors, levelInfo) => {
      // Factor específico para cada subnivel
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      
      // Para subniveles avanzados, usamos valor de sqrt(3) más preciso
      const sqrt3 = levelInfo.subLevel >= 4 ? Math.sqrt(3) : 1.732;
      
      return {
        area: (3 * sqrt3 * side * side) / 2 * factor,
        perimeter: 6 * side * factor
      };
    },
    formulas: (useFactors, levelInfo) => {
      const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
      const factorText = useFactors ? ` × ${factor.toFixed(2)}` : '';
      
      // Distintas representaciones de la raíz cuadrada según el nivel
      const sqrt3Symbol = levelInfo.subLevel >= 4 ? '√3' : '1.732';
      
      return {
        area: `A = (3${sqrt3Symbol} × s²) ÷ 2${factorText}`,
        perimeter: `P = 6s${factorText}`
      };
    },
    level: 4,
    getDefaultValues: (subLevel) => {
      // Variación de valores según subnivel
      switch(subLevel) {
        case 1: return [getRandomValue(2, 4)];
        case 2: return [getRandomValue(3, 5)];
        case 3: return [getRandomValue(4, 6)];
        case 4: return [getRandomValue(5, 7, false)]; // Con decimales
        case 5: return [getRandomValue(6, 9, false)]; // Con decimales
        default: return [3];
      }
    }
  }
};

// Visual components for each shape with measurement labels
const MeasuredCircle: React.FC<{ radius: number, size: number, useFactors: boolean, levelInfo: LevelInfo }> = 
  ({ radius, size, useFactors, levelInfo }) => {
  const scale = size / (radius * 2.5);
  const centerX = size / 2;
  const centerY = size / 2;
  const scaledRadius = radius * scale;
  const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
  
  // Para subniveles superiores, agregamos detalles adicionales
  const showDiameter = levelInfo.subLevel >= 3;
  const showExtraInfo = levelInfo.subLevel >= 4;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <circle 
        cx={centerX} 
        cy={centerY} 
        r={scaledRadius} 
        fill="rgba(79, 70, 229, 0.2)" 
        stroke="rgb(79, 70, 229)" 
        strokeWidth="2" 
      />
      
      <line 
        x1={centerX} 
        y1={centerY} 
        x2={centerX + scaledRadius} 
        y2={centerY} 
        stroke="rgb(79, 70, 229)" 
        strokeWidth="1.5" 
        strokeDasharray="5,3" 
      />
      
      {showDiameter && (
        <line 
          x1={centerX - scaledRadius} 
          y1={centerY} 
          x2={centerX + scaledRadius} 
          y2={centerY} 
          stroke="rgb(79, 70, 229)" 
          strokeWidth="1" 
          strokeDasharray="3,3" 
        />
      )}
      
      <text 
        x={centerX + scaledRadius/2} 
        y={centerY - 8} 
        textAnchor="middle" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
      >
        r = {radius}
      </text>
      
      {showDiameter && (
        <text 
          x={centerX} 
          y={centerY + 16} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          d = {(radius * 2).toFixed(radius % 1 === 0 ? 0 : 1)}
        </text>
      )}
      
      {showExtraInfo && (
        <text 
          x={centerX} 
          y={size - 15} 
          textAnchor="middle" 
          fontSize="11" 
          fill="rgb(79, 70, 229)" 
        >
          C = 2πr = {(2 * Math.PI * radius).toFixed(2)}
        </text>
      )}
      
      {useFactors && (
        <text 
          x={centerX} 
          y={centerY + scaledRadius + 20} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          Factor: ×{factor.toFixed(2)}
        </text>
      )}
      
      <circle 
        cx={centerX} 
        cy={centerY} 
        r="3" 
        fill="rgb(79, 70, 229)" 
      />
    </svg>
  );
};

const MeasuredSquare: React.FC<{ side: number, size: number, useFactors: boolean, levelInfo: LevelInfo }> = 
  ({ side, size, useFactors, levelInfo }) => {
  const scale = size / (side * 1.5);
  const squareSize = side * scale;
  const margin = (size - squareSize) / 2;
  const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
  
  // Detalles adicionales para niveles superiores
  const showDiagonal = levelInfo.subLevel >= 3;
  const showPerimeterCalc = levelInfo.subLevel >= 4;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <rect 
        x={margin} 
        y={margin} 
        width={squareSize} 
        height={squareSize} 
        fill="rgba(79, 70, 229, 0.2)" 
        stroke="rgb(79, 70, 229)" 
        strokeWidth="2" 
      />
      
      {showDiagonal && (
        <line 
          x1={margin} 
          y1={margin} 
          x2={margin + squareSize} 
          y2={margin + squareSize} 
          stroke="rgb(79, 70, 229)" 
          strokeWidth="1" 
          strokeDasharray="5,3" 
        />
      )}
      
      <text 
        x={margin + squareSize/2} 
        y={margin - 8} 
        textAnchor="middle" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
      >
        s = {side}
      </text>
      
      <text 
        x={margin + squareSize + 8} 
        y={margin + squareSize/2} 
        textAnchor="start" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
        transform={`rotate(90, ${margin + squareSize + 8}, ${margin + squareSize/2})`}
      >
        s = {side}
      </text>
      
      {showDiagonal && (
        <text 
          x={margin + squareSize/2 + 10} 
          y={margin + squareSize/2 - 10} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          d = {(side * Math.sqrt(2)).toFixed(2)}
        </text>
      )}
      
      {showPerimeterCalc && (
        <text 
          x={margin + squareSize/2} 
          y={margin + squareSize + 30} 
          textAnchor="middle" 
          fontSize="11" 
          fill="rgb(79, 70, 229)" 
        >
          P = 4s = {4 * side}
        </text>
      )}
      
      {useFactors && (
        <text 
          x={margin + squareSize/2} 
          y={margin + squareSize + (showPerimeterCalc ? 50 : 20)} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          Factor: ×{factor.toFixed(2)}
        </text>
      )}
    </svg>
  );
};

const MeasuredRectangle: React.FC<{ length: number, width: number, size: number, useFactors: boolean, levelInfo: LevelInfo }> = 
  ({ length, width, size, useFactors, levelInfo }) => {
  const scale = size / (Math.max(length, width) * 1.5);
  const rectWidth = length * scale;
  const rectHeight = width * scale;
  const marginX = (size - rectWidth) / 2;
  const marginY = (size - rectHeight) / 2;
  const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
  
  // Detalles adicionales para niveles superiores
  const showDiagonal = levelInfo.subLevel >= 3;
  const showPerimeterCalc = levelInfo.subLevel >= 4;
  const showAreaCalc = levelInfo.subLevel >= 5;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <rect 
        x={marginX} 
        y={marginY} 
        width={rectWidth} 
        height={rectHeight} 
        fill="rgba(79, 70, 229, 0.2)" 
        stroke="rgb(79, 70, 229)" 
        strokeWidth="2" 
      />
      
      {showDiagonal && (
        <line 
          x1={marginX} 
          y1={marginY} 
          x2={marginX + rectWidth} 
          y2={marginY + rectHeight} 
          stroke="rgb(79, 70, 229)" 
          strokeWidth="1" 
          strokeDasharray="5,3" 
        />
      )}
      
      <text 
        x={marginX + rectWidth/2} 
        y={marginY - 8} 
        textAnchor="middle" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
      >
        l = {length}
      </text>
      
      <text 
        x={marginX + rectWidth + 8} 
        y={marginY + rectHeight/2} 
        textAnchor="start" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
        transform={`rotate(90, ${marginX + rectWidth + 8}, ${marginY + rectHeight/2})`}
      >
        w = {width}
      </text>
      
      {showDiagonal && (
        <text 
          x={marginX + rectWidth/2 + 10} 
          y={marginY + rectHeight/2 - 10} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          d = {(Math.sqrt(length*length + width*width)).toFixed(2)}
        </text>
      )}
      
      {showPerimeterCalc && (
        <text 
          x={marginX + rectWidth/2} 
          y={marginY + rectHeight + 30} 
          textAnchor="middle" 
          fontSize="11" 
          fill="rgb(79, 70, 229)" 
        >
          P = 2(l + w) = {2 * (length + width)}
        </text>
      )}
      
      {showAreaCalc && (
        <text 
          x={marginX + rectWidth/2} 
          y={marginY + rectHeight + 50} 
          textAnchor="middle" 
          fontSize="11" 
          fill="rgb(79, 70, 229)" 
        >
          A = l × w = {length * width}
        </text>
      )}
      
      {useFactors && (
        <text 
          x={marginX + rectWidth/2} 
          y={marginY + rectHeight + (showAreaCalc ? 70 : showPerimeterCalc ? 50 : 20)} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          Factor: ×{factor.toFixed(2)}
        </text>
      )}
    </svg>
  );
};

// Solución mejorada para el componente MeasuredTriangle que genera diferentes tipos de triángulos
const MeasuredTriangle: React.FC<{ 
  base: number, 
  height: number, 
  side2: number, 
  side3: number, 
  size: number, 
  useFactors: boolean,
  levelInfo: LevelInfo
}> = ({ base, height, side2, side3, size, useFactors, levelInfo }) => {
  const scale = size / (Math.max(base, height) * 1.5);
  const scaledBase = base * scale;
  const scaledHeight = height * scale;
  const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
  
  // Determinar el tipo de triángulo según el subnivel
  const subLevel = levelInfo?.subLevel || 1;
  const showBaseMarker = subLevel >= 2; // Mostrar marcadores de base a partir del nivel 2.2
  const showRightAngle = subLevel === 2; // Mostrar ángulo recto para nivel 2.2
  const showAreaCalc = subLevel >= 4; // Mostrar cálculo de área para nivel 2.4+
  
  let x1, y1, x2, y2, x3, y3;
  
  // Ajustar las coordenadas según el subnivel para generar diferentes tipos de triángulos
  switch(subLevel) {
    case 1: // Triángulo isósceles para nivel 2.1
      x1 = (size - scaledBase) / 2;
      y1 = size - (size - scaledHeight) / 2;
      x2 = x1 + scaledBase;
      y2 = y1;
      x3 = x1 + scaledBase / 2;
      y3 = y1 - scaledHeight;
      break;
      
    case 2: // Triángulo rectángulo para nivel 2.2
      x1 = (size - scaledBase) / 3;
      y1 = size - (size - scaledHeight) / 2;
      x2 = x1 + scaledBase;
      y2 = y1;
      x3 = x1;
      y3 = y1 - scaledHeight;
      break;
      
    case 3: // Triángulo escaleno para nivel 2.3
      x1 = (size - scaledBase) / 3;
      y1 = size - (size - scaledHeight) / 2;
      x2 = x1 + scaledBase;
      y2 = y1;
      x3 = x1 + scaledBase / 3;
      y3 = y1 - scaledHeight;
      break;
      
    case 4: // Triángulo obtusángulo para nivel 2.4
      x1 = (size - scaledBase) / 4;
      y1 = size - (size - scaledHeight) / 2;
      x2 = x1 + scaledBase;
      y2 = y1;
      x3 = x1 + scaledBase * 0.75;
      y3 = y1 - scaledHeight;
      break;
      
    case 5: // Triángulo acutángulo para nivel 2.5
      x1 = (size - scaledBase) / 2;
      y1 = size - (size - scaledHeight) / 2;
      x2 = x1 + scaledBase;
      y2 = y1;
      x3 = x1 + scaledBase / 2;
      y3 = y1 - scaledHeight * 1.2;
      break;
      
    default:
      x1 = (size - scaledBase) / 2;
      y1 = size - (size - scaledHeight) / 2;
      x2 = x1 + scaledBase;
      y2 = y1;
      x3 = x1 + scaledBase / 2;
      y3 = y1 - scaledHeight;
  }
  
  // Cálculo de puntos medios de los lados, con mayor desplazamiento
  const side2MidX = (x1 + x3) / 2;
  const side2MidY = (y1 + y3) / 2;
  const side3MidX = (x2 + x3) / 2;
  const side3MidY = (y2 + y3) / 2;
  
  // Ángulos de los lados para rotación
  const side2Angle = Math.atan2(y1 - y3, x3 - x1) * 180 / Math.PI;
  const side3Angle = Math.atan2(y3 - y2, x3 - x2) * 180 / Math.PI;
  
  // Desplazamiento para etiquetas de lados
  const side2OffsetX = -35;
  const side2OffsetY = 0;
  const side3OffsetX = 35;
  const side3OffsetY = 0;
  
  // Configuración para marcadores de base
  const baseMarkerHeight = 6; // Altura de las marcas perpendiculares
  const baseMarkerY = y1 + baseMarkerHeight; // Posición Y bajo la base
  
  // Tipo de triángulo para mostrar en etiqueta según subnivel
  let triangleType = "";
  if (subLevel === 1) triangleType = "Isósceles";
  if (subLevel === 2) triangleType = "Rectángulo";
  if (subLevel === 3) triangleType = "Escaleno";
  if (subLevel === 4) triangleType = "Obtusángulo";
  if (subLevel === 5) triangleType = "Acutángulo";
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <polygon 
        points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} 
        fill="rgba(79, 70, 229, 0.2)" 
        stroke="rgb(79, 70, 229)" 
        strokeWidth="2" 
      />
      
      <line 
        x1={x3} 
        y1={y3} 
        x2={x3} 
        y2={y1} 
        stroke="rgb(79, 70, 229)" 
        strokeWidth="1.5" 
        strokeDasharray="5,3" 
      />
      
      {/* Marcadores de base (mostrar solo en niveles 2.2 y superiores) */}
      {showBaseMarker && (
        <>
          {/* Marcadores perpendiculares en los extremos de la base */}
          <line 
            x1={x1} 
            y1={y1} 
            x2={x1} 
            y2={baseMarkerY} 
            stroke="rgb(79, 70, 229)" 
            strokeWidth="1.5"
          />
          <line 
            x1={x2} 
            y1={y2} 
            x2={x2} 
            y2={baseMarkerY} 
            stroke="rgb(79, 70, 229)" 
            strokeWidth="1.5"
          />
          {/* Línea horizontal para señalar claramente la base */}
          <line 
            x1={x1} 
            y1={baseMarkerY} 
            x2={x2} 
            y2={baseMarkerY} 
            stroke="rgb(79, 70, 229)" 
            strokeWidth="1" 
            strokeDasharray="3,2"
          />
        </>
      )}
      
      {/* Marcador de ángulo recto para triángulo rectángulo */}
      {showRightAngle && (
        <path
          d={`M ${x1 + 10} ${y1} L ${x1 + 10} ${y1 - 10} L ${x1} ${y1 - 10}`}
          fill="none"
          stroke="rgb(79, 70, 229)"
          strokeWidth="1.5"
        />
      )}
      
      <text 
        x={(x1 + x2) / 2} 
        y={y1 + 16} 
        textAnchor="middle" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
      >
        b = {base}
      </text>
      
      <text 
        x={x3 + 12}
        y={(y1 + y3) / 2} 
        textAnchor="start" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
      >
        h = {height}
      </text>
      
      {/* Etiqueta s2 con mayor desplazamiento */}
      <text 
        x={side2MidX + side2OffsetX} 
        y={side2MidY + side2OffsetY} 
        textAnchor="middle" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
        transform={`rotate(${side2Angle}, ${side2MidX + side2OffsetX}, ${side2MidY + side2OffsetY})`}
      >
        s2 = {side2}
      </text>
      
      {/* Etiqueta s3 con mayor desplazamiento */}
      <text 
        x={side3MidX + side3OffsetX} 
        y={side3MidY + side3OffsetY} 
        textAnchor="middle" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
        transform={`rotate(${side3Angle}, ${side3MidX + side3OffsetX}, ${side3MidY + side3OffsetY})`}
      >
        s3 = {side3}
      </text>
      
      {/* Etiqueta para el tipo de triángulo */}
      <text 
        x={(x1 + x2 + x3) / 3} 
        y={y3 - 15} 
        textAnchor="middle" 
        fontSize="11" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
      >
        {triangleType}
      </text>
      
      {/* Fórmula de área para niveles avanzados */}
      {showAreaCalc && (
        <text 
          x={(x1 + x2) / 2} 
          y={y1 + 36} 
          textAnchor="middle" 
          fontSize="11" 
          fill="rgb(79, 70, 229)" 
        >
          {subLevel >= 4 ? 
            `A = √[s(s-a)(s-b)(s-c)] ≈ ${((base * height) / 2).toFixed(2)}` : 
            `A = (b × h) ÷ 2 = ${((base * height) / 2)}`
          }
        </text>
      )}
      
      {useFactors && (
        <text 
          x={(x1 + x2) / 2} 
          y={y1 + (showAreaCalc ? 56 : 36)} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          Factor: ×{factor.toFixed(2)}
        </text>
      )}
    </svg>
  );
};

const MeasuredHexagon: React.FC<{ side: number, size: number, useFactors: boolean, levelInfo: LevelInfo }> = 
  ({ side, size, useFactors, levelInfo }) => {
  const scale = size / (side * 2.5);
  const radius = side * scale;
  const centerX = size / 2;
  const centerY = size / 2;
  const factor = useFactors ? 1 + (levelInfo.subLevel * 0.05) : 1;
  
  // Detalles adicionales según subnivel
  const showRadius = levelInfo.subLevel >= 2;
  const showInnerRadius = levelInfo.subLevel >= 3;
  const showAreaDetails = levelInfo.subLevel >= 4;
  
  // Calcular vértices del hexágono
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  // Valor de raíz de 3 para cálculos, más preciso en niveles superiores
  const sqrt3 = levelInfo.subLevel >= 4 ? Math.sqrt(3) : 1.732;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <polygon 
        points={points.join(' ')} 
        fill="rgba(79, 70, 229, 0.2)" 
        stroke="rgb(79, 70, 229)" 
        strokeWidth="2" 
      />
      
      {/* Mostrar radio exterior en niveles superiores */}
      {showRadius && (
        <line 
          x1={centerX} 
          y1={centerY} 
          x2={centerX + radius} 
          y2={centerY} 
          stroke="rgb(79, 70, 229)" 
          strokeWidth="1" 
          strokeDasharray="5,3" 
        />
      )}
      
      {/* Mostrar radio interior (apotema) en niveles superiores */}
      {showInnerRadius && (
        <line 
          x1={centerX} 
          y1={centerY} 
          x2={centerX + radius * Math.cos(Math.PI/6)} 
          y2={centerY} 
          stroke="rgb(79, 70, 229)" 
          strokeWidth="1" 
          strokeDasharray="3,2" 
        />
      )}
      
      <text 
        x={centerX + radius * Math.cos(Math.PI/6) / 2} 
        y={centerY + radius * Math.sin(Math.PI/6) + 20} 
        textAnchor="middle" 
        fontSize="12" 
        fill="rgb(79, 70, 229)" 
        fontWeight="bold"
      >
        s = {side}
      </text>
      
      {showRadius && (
        <text 
          x={centerX + radius/2} 
          y={centerY - 8} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          R = {side.toFixed(1)}
        </text>
      )}
      
      {showInnerRadius && (
        <text 
          x={centerX + radius * Math.cos(Math.PI/6)/2} 
          y={centerY + 16} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          r = {(side * sqrt3/2).toFixed(2)}
        </text>
      )}
      
      {showAreaDetails && (
        <text 
          x={centerX} 
          y={centerY - radius - 15} 
          textAnchor="middle" 
          fontSize="11" 
          fill="rgb(79, 70, 229)" 
        >
          A = (3√3 × s²) ÷ 2 = {((3 * sqrt3 * side * side) / 2).toFixed(2)}
        </text>
      )}
      
      {useFactors && (
        <text 
          x={centerX} 
          y={centerY + radius + 30} 
          textAnchor="middle" 
          fontSize="12" 
          fill="rgb(79, 70, 229)" 
          fontWeight="bold"
        >
          Factor: ×{factor.toFixed(2)}
        </text>
      )}
    </svg>
  );
};

// Component to select the appropriate visual based on shape and values
const ShapeVisual: React.FC<{ 
  shape: Shape, 
  size: number, 
  values?: number[], 
  useFactors: boolean,
  levelInfo: LevelInfo 
}> = ({ shape, size, values, useFactors, levelInfo }) => {
  // Use provided values or defaults
  const defaultValues = values || shapes[shape].getDefaultValues(levelInfo?.subLevel || 1);
  
  switch(shape) {
    case 'circle':
      return <MeasuredCircle radius={defaultValues[0]} size={size} useFactors={useFactors} levelInfo={levelInfo} />;
    case 'square':
      return <MeasuredSquare side={defaultValues[0]} size={size} useFactors={useFactors} levelInfo={levelInfo} />;
    case 'rectangle':
      return <MeasuredRectangle length={defaultValues[0]} width={defaultValues[1]} size={size} useFactors={useFactors} levelInfo={levelInfo} />;
    case 'triangle':
      return <MeasuredTriangle 
        base={defaultValues[0]} 
        height={defaultValues[1]} 
        side2={defaultValues[2]} 
        side3={defaultValues[3]} 
        size={size} 
        useFactors={useFactors}
        levelInfo={levelInfo}
      />;
    case 'hexagon':
      return <MeasuredHexagon side={defaultValues[0]} size={size} useFactors={useFactors} levelInfo={levelInfo} />;
    default:
      return null;
  }
};

// Other interfaces
interface Settings {
  problemCount: number;
  timeLimit: number;
  maxAttempts: number;
  enableCompensation: boolean;
  startingLevel: LevelInfo;
  enableFactors: boolean;
}

interface UserAnswer {
  shape: Shape;
  levelInfo: LevelInfo;
  inputValues: number[];
  results: { area: number; perimeter: number };
  userArea: number | null;
  userPerimeter: number | null;
  isCorrect: boolean;
  wasRevealed: boolean;
  timeSpent: number;
  attemptsMade: number;
  useFactors: boolean;
}

// Settings component
export const GeometrySettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('geometry_settings');
    const defaultSettings: Settings = { 
      problemCount: 10, 
      timeLimit: 0, 
      maxAttempts: 3, 
      enableCompensation: false,
      startingLevel: { mainLevel: 1, subLevel: 1 },
      enableFactors: false
    };
    if (!saved) return defaultSettings;
    try {
      const parsed = JSON.parse(saved);
      return {
        problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount,
        timeLimit: parseInt(parsed.timeLimit, 10) >= 0 ? parseInt(parsed.timeLimit, 10) : defaultSettings.timeLimit,
        maxAttempts: parseInt(parsed.maxAttempts, 10) >= 0 ? parseInt(parsed.maxAttempts, 10) : defaultSettings.maxAttempts,
        enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : defaultSettings.enableCompensation,
        startingLevel: parsed.startingLevel || defaultSettings.startingLevel,
        enableFactors: typeof parsed.enableFactors === 'boolean' ? parsed.enableFactors : defaultSettings.enableFactors
      };
    } catch { return defaultSettings; }
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      localStorage.setItem('geometry_settings', JSON.stringify(settings));
    });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | boolean;

    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number' || ['problemCount', 'timeLimit', 'maxAttempts'].includes(name)) {
      const numValue = parseInt(value, 10);
      if (name === 'problemCount') parsedValue = isNaN(numValue) || numValue <= 0 ? 1 : numValue;
      else if (name === 'timeLimit') parsedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
      else if (name === 'maxAttempts') parsedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
      else parsedValue = isNaN(numValue) ? 0 : numValue;
    } else {
      parsedValue = value;
    }

    setSettings(prev => ({ ...prev, [name]: parsedValue }));
  };

  // Handler para cambiar nivel principal
  const handleMainLevelChange = (level: MainLevel) => {
    setSettings(prev => ({
      ...prev,
      startingLevel: { mainLevel: level, subLevel: 1 }
    }));
  };

  // Handler para cambiar subnivel
  const handleSubLevelChange = (mainLevel: MainLevel, subLevel: SubLevel) => {
    setSettings(prev => ({
      ...prev,
      startingLevel: { mainLevel, subLevel }
    }));
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Geometry Settings</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
            Starting Level: {formatLevel(settings.startingLevel)}
          </h3>
          
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={`level-${level}`}
                onClick={() => handleMainLevelChange(level as MainLevel)}
                className={`px-3 py-2 rounded ${
                  settings.startingLevel.mainLevel === level 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                Level {level}
              </button>
            ))}
          </div>
          
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Select Sublevel ({settings.startingLevel.subLevel}/5):
            </p>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((sublevel) => (
                <button
                  key={`sublevel-${sublevel}`}
                  onClick={() => handleSubLevelChange(
                    settings.startingLevel.mainLevel, 
                    sublevel as SubLevel
                  )}
                  className={`text-sm py-1 px-2 rounded ${
                    settings.startingLevel.subLevel === sublevel
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {settings.startingLevel.mainLevel}.{sublevel}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {settings.startingLevel.mainLevel === 1 && '⭐ Level 1: Rectangles & Squares'}
              {settings.startingLevel.mainLevel === 2 && '⭐ Level 2: Triangles'}
              {settings.startingLevel.mainLevel === 3 && '⭐ Level 3: Circles'}
              {settings.startingLevel.mainLevel === 4 && '⭐ Level 4: Hexagons'}
              {settings.startingLevel.mainLevel === 5 && '⭐ Level 5: Mixed Shapes'}
              <br />
              Sublevel 1: Very easy → Sublevel 5: Challenging
            </p>
          </div>
        </div>
        
        <div>
          <label htmlFor="problemCountInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Problems
          </label>
          <input 
            type="number" 
            id="problemCountInput" 
            name="problemCount" 
            min="1" 
            max="100" 
            step="1" 
            value={settings.problemCount} 
            onChange={handleChange} 
            className="input-field-style"
          />
        </div>
        
        <div>
          <label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Attempts per Problem (0 for unlimited)
          </label>
          <input 
            type="number" 
            id="maxAttempts" 
            name="maxAttempts" 
            min="0" 
            value={settings.maxAttempts} 
            onChange={handleChange} 
            className="input-field-style"
          />
        </div>
        
        <div>
          <label htmlFor="timeLimitInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Limit (seconds per problem, 0 for no limit)
          </label>
          <input 
            id="timeLimitInput" 
            type="number" 
            name="timeLimit" 
            min="0" 
            max="120" 
            value={settings.timeLimit} 
            onChange={handleChange} 
            className="input-field-style"
          />
        </div>
        
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="enableCompensation" 
            name="enableCompensation" 
            checked={settings.enableCompensation} 
            onChange={handleChange} 
            className="checkbox-style"
          />
          <label htmlFor="enableCompensation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Enable Compensation (Add 1 problem for each incorrect/revealed)
          </label>
        </div>
        
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="enableFactors" 
            name="enableFactors" 
            checked={settings.enableFactors} 
            onChange={handleChange} 
            className="checkbox-style"
          />
          <label htmlFor="enableFactors" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Enable Complexity Factors (Harder calculations with multipliers)
          </label>
        </div>
      </div>
      <style jsx>{`
        .input-field-style { 
          margin-top: 0.25rem; 
          display: block; 
          width: 100%; 
          padding: 0.5rem 0.75rem; 
          border: 1px solid #d1d5db; 
          border-radius: 0.375rem; 
          box-shadow: sm; 
          outline: none; 
          focus:ring-indigo-500 
          focus:border-indigo-500; 
          font-size: 0.875rem; 
          background-color: white; 
          dark:bg-gray-800 
          dark:border-gray-700 
          dark:text-white; 
        }
        .checkbox-style { 
          height: 1rem; 
          width: 1rem; 
          color: #4f46e5; 
          focus:ring-indigo-500; 
          border-color: #d1d5db; 
          border-radius: 0.25rem; 
          dark:border-gray-600 
          dark:bg-gray-700 
          dark:focus:ring-indigo-600 
          dark:ring-offset-gray-800; 
        }
      `}</style>
    </div>
  );
};

// Main exercise component
export const GeometryExercise: React.FC = () => {
  // Settings and state
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('geometry_settings');
    const defaultSettings: Settings = { 
      problemCount: 10, 
      timeLimit: 0, 
      maxAttempts: 3, 
      enableCompensation: false,
      startingLevel: { mainLevel: 1, subLevel: 1 },
      enableFactors: false
    };
    if (!saved) return defaultSettings;
    try {
      const parsed = JSON.parse(saved);
      return {
        problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount,
        timeLimit: parseInt(parsed.timeLimit, 10) >= 0 ? parseInt(parsed.timeLimit, 10) : defaultSettings.timeLimit,
        maxAttempts: parseInt(parsed.maxAttempts, 10) >= 0 ? parseInt(parsed.maxAttempts, 10) : defaultSettings.maxAttempts,
        enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : defaultSettings.enableCompensation,
        startingLevel: parsed.startingLevel || defaultSettings.startingLevel,
        enableFactors: typeof parsed.enableFactors === 'boolean' ? parsed.enableFactors : defaultSettings.enableFactors
      };
    } catch { return defaultSettings; }
  });

  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [currentLevelInfo, setCurrentLevelInfo] = useState<LevelInfo>(settings.startingLevel);
  const [availableShapes, setAvailableShapes] = useState<Shape[]>([]);
  const [recentShapes, setRecentShapes] = useState<Shape[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [areaInput, setAreaInput] = useState<string>('');
  const [perimeterInput, setPerimeterInput] = useState<string>('');
  const [results, setResults] = useState<{ area: number; perimeter: number } | null>(null);
  const [error, setError] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isAutoContinueEnabled, setIsAutoContinueEnabled] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [targetProblemCount, setTargetProblemCount] = useState(settings.problemCount);
  const [problemStartTime, setProblemStartTime] = useState<number>(0);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  
  // Determinar si debemos usar factores
  const [useFactors, setUseFactors] = useState<boolean>(settings.enableFactors);

  const isSubmitting = useRef(false);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxRecentlyUsed = 2; // Número máximo de figuras a recordar como "recientes"

  // Function to get shapes for the current level
  const getShapesForLevel = useCallback((levelInfo: LevelInfo): Shape[] => {
    const { mainLevel } = levelInfo;
    if (mainLevel === 1) return ['square', 'rectangle'];
    if (mainLevel === 2) return ['triangle'];
    if (mainLevel === 3) return ['circle'];
    if (mainLevel === 4) return ['hexagon'];
    return ['square', 'rectangle', 'triangle', 'circle', 'hexagon']; // Level 5: All shapes
  }, []);

  // Update available shapes when level changes
  useEffect(() => {
    setAvailableShapes(getShapesForLevel(currentLevelInfo));
  }, [currentLevelInfo, getShapesForLevel]);

  // Function to emit progress
  const emitProgress = useCallback((data: { 
    correct: boolean; 
    timeSpent: number; 
    levelInfo: LevelInfo;
    attempts: number; 
    revealed: boolean;
    useFactors: boolean;
  }) => {
    const event = new CustomEvent('operationProgress', { 
      detail: { operationType: 'geometry', ...data } 
    });
    window.dispatchEvent(event);
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'geometry_settings' && event.newValue) {
        try {
          const newSettings = JSON.parse(event.newValue) as Partial<Settings>;
          setSettings(prev => ({
            problemCount: newSettings.problemCount ?? prev.problemCount,
            timeLimit: newSettings.timeLimit ?? prev.timeLimit,
            maxAttempts: newSettings.maxAttempts ?? prev.maxAttempts,
            enableCompensation: typeof newSettings.enableCompensation === 'boolean' ? newSettings.enableCompensation : prev.enableCompensation,
            startingLevel: newSettings.startingLevel || prev.startingLevel,
            enableFactors: typeof newSettings.enableFactors === 'boolean' ? newSettings.enableFactors : prev.enableFactors
          }));

          // Actualizar uso de factores si cambia la configuración
          if (typeof newSettings.enableFactors === 'boolean' && !isComplete) {
            setUseFactors(newSettings.enableFactors);
          }
        } catch (error) { console.error('Error parsing settings from storage:', error); }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isComplete]);

  // Reset exercise
  useEffect(() => {
    setCurrentIndex(0);
    setUserAnswers([]);
    setIsComplete(false);
    setFeedback(null);
    setShowContinueButton(false);
    setIsReviewMode(false);
    setReviewIndex(0);
    setCurrentLevelInfo(settings.startingLevel);
    setConsecutiveCorrectAnswers(0);
    setTargetProblemCount(settings.problemCount);
    setRecentShapes([]);
    setUseFactors(settings.enableFactors);
    isSubmitting.current = false;
    
    // Clean up timers
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    autoContinueTimerRef.current = null;
    tooltipTimerRef.current = null;

    // Focus on initial input
    const focusTimeout = setTimeout(() => {
      if (!isReviewMode) inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(focusTimeout);
  }, [settings]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  // Focus on current input
  useEffect(() => {
    if (!isComplete && !showContinueButton && !isReviewMode && selectedShape && !autoContinueTimerRef.current) {
      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
        if (error) {
          inputRef.current?.select();
        }
      }, 50);
      return () => clearTimeout(focusTimeout);
    }
  }, [currentIndex, showContinueButton, isComplete, selectedShape, error, isReviewMode]);

  // Auto-continue
  useEffect(() => {
    if (showContinueButton && isAutoContinueEnabled && !isReviewMode) {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY);
    }
    return () => {
      if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
      }
    };
  }, [showContinueButton, isAutoContinueEnabled, isReviewMode]);

  // Check if we should advance level/sublevel
  const advanceLevel = useCallback(() => {
    setCurrentLevelInfo(prev => {
      // Si no estamos en el último subnivel, avanzar al siguiente subnivel
      if (prev.subLevel < 5) {
        return { ...prev, subLevel: (prev.subLevel + 1) as SubLevel };
      }
      // Si estamos en el último subnivel pero no en el último nivel principal, avanzar al siguiente nivel
      else if (prev.mainLevel < 5) {
        return { mainLevel: (prev.mainLevel + 1) as MainLevel, subLevel: 1 };
      }
      // Ya estamos en el nivel máximo
      return prev;
    });
  }, []);

  // Select random shape with improved variety
  const selectRandomShape = useCallback(() => {
    if (availableShapes.length === 0) return null;
    
    // Si solo hay un tipo de figura disponible, no hay más opción
    if (availableShapes.length === 1) {
      const shape = availableShapes[0];
      setSelectedShape(shape);
      setRecentShapes(prev => {
        const newRecent = [shape, ...prev].slice(0, maxRecentlyUsed);
        return newRecent;
      });
      setInputValues({});
      setAreaInput('');
      setPerimeterInput('');
      setResults(null);
      setError('');
      setCurrentAttempts(0);
      setIsAnswerRevealed(false);
      setProblemStartTime(Date.now());
      return shape;
    }
    
    // Si hay más de una figura disponible, evitar repetir las recientes
    let availableForSelection = [...availableShapes];
    
    // Si la última figura seleccionada existe y hay suficientes opciones,
    // eliminarla de las posibilidades para garantizar variedad
    if (recentShapes.length > 0 && availableForSelection.length > 1) {
      availableForSelection = availableForSelection.filter(
        shape => shape !== recentShapes[0]
      );
    }
    
    // Seleccionar aleatoriamente de las figuras disponibles que no son recientes
    const randomIndex = Math.floor(Math.random() * availableForSelection.length);
    const shape = availableForSelection[randomIndex];
    
    // Actualizar la figura seleccionada y el historial
    setSelectedShape(shape);
    setRecentShapes(prev => {
      const newRecent = [shape, ...prev].slice(0, maxRecentlyUsed);
      return newRecent;
    });
    
    // Reiniciar estados relacionados
    setInputValues({});
    setAreaInput('');
    setPerimeterInput('');
    setResults(null);
    setError('');
    setCurrentAttempts(0);
    setIsAnswerRevealed(false);
    setProblemStartTime(Date.now());
    
    return shape;
  }, [availableShapes, recentShapes]);

  // Start new problem
  useEffect(() => {
    if (!isComplete && !isReviewMode && currentIndex < targetProblemCount && !selectedShape) {
      selectRandomShape();
    }
  }, [currentIndex, isComplete, isReviewMode, selectRandomShape, targetProblemCount, selectedShape]);

  // Handle shape selection
  const handleShapeSelect = (shape: Shape) => {
    setSelectedShape(shape);
    setRecentShapes(prev => {
      const newRecent = [shape, ...prev].slice(0, maxRecentlyUsed);
      return newRecent;
    });
    setInputValues({});
    setAreaInput('');
    setPerimeterInput('');
    setResults(null);
    setError('');
    setCurrentAttempts(0);
    setIsAnswerRevealed(false);
    setProblemStartTime(Date.now());
  };

  // Handle input changes
  const handleInputChange = (input: string, value: string) => {
    setInputValues(prev => ({ ...prev, [input]: value }));
    setError('');
  };

  // Determinar si debemos usar factores basado en el nivel y respuestas correctas
  const shouldUseFactors = useCallback(() => {
    // Si está habilitado en configuración, siempre usar
    if (settings.enableFactors) return true;
    
    // Automáticamente a partir del nivel 4 con 5+ respuestas consecutivas
    if (currentLevelInfo.mainLevel >= 4 && consecutiveCorrectAnswers >= FACTOR_ACTIVATION_THRESHOLD) {
      return true;
    }
    
    return false;
  }, [currentLevelInfo.mainLevel, consecutiveCorrectAnswers, settings.enableFactors]);

  // Actualizar factores cuando cambian las condiciones
  useEffect(() => {
    setUseFactors(shouldUseFactors());
  }, [shouldUseFactors]);

  // Obtener valores predeterminados según el nivel actual
  const getCurrentDefaultValues = useCallback(() => {
    if (!selectedShape) return [];
    return shapes[selectedShape].getDefaultValues(currentLevelInfo.subLevel);
  }, [selectedShape, currentLevelInfo]);

  // Calculate results
  const calculateResults = () => {
    if (!selectedShape) return null;

    const shape = shapes[selectedShape];
    const values = shape.inputs.map(input => {
      const value = parseFloat(inputValues[input] || '0');
      return isNaN(value) ? 0 : value;
    });

    // Basic validations
    if (values.some(v => v <= 0)) {
      setError('All measurements must be positive numbers');
      return null;
    }

    // Shape-specific validations
    if (selectedShape === 'triangle') {
      const [a, _, b, c] = values;
      if (a + b <= c || b + c <= a || a + c <= b) {
        setError('Invalid triangle sides: sum of any two sides must be greater than the third side');
        return null;
      }
    }

    return shape.calculate(values, useFactors, currentLevelInfo);
  };

  // Handle "Show Answer"
  const handleShowAnswer = () => {
    if (isAnswerRevealed || showContinueButton || isSubmitting.current || !selectedShape) return;
    isSubmitting.current = true;
    
    // Use default values for current level
    const shape = shapes[selectedShape];
    const defaultValues = shape.getDefaultValues(currentLevelInfo.subLevel);
    const calculatedResults = shape.calculate(defaultValues, useFactors, currentLevelInfo);
    
    // Update values to show 
    shape.inputs.forEach((input, index) => {
      setInputValues(prev => ({
        ...prev,
        [input]: defaultValues[index].toString()
      }));
    });
    
    // Set revealed state
    setIsAnswerRevealed(true);
    setResults(calculatedResults);
    
    const timeSpent = (Date.now() - problemStartTime) / 1000;
    const attemptsCounted = settings.maxAttempts > 0 ? settings.maxAttempts : 1;
    
    // Show feedback
    setFeedback({ 
      correct: false, 
      message: `Answer revealed: Area = ${calculatedResults.area.toFixed(2)}, Perimeter = ${calculatedResults.perimeter.toFixed(2)}` 
    });
    
    // Register revealed answer
    setUserAnswers(prev => [...prev, { 
      shape: selectedShape,
      levelInfo: { ...currentLevelInfo },
      inputValues: defaultValues,
      results: calculatedResults,
      userArea: null,
      userPerimeter: null,
      isCorrect: false, 
      wasRevealed: true,
      timeSpent, 
      attemptsMade: attemptsCounted,
      useFactors: useFactors
    }]);
    
    // Reset consecutive correct answers
    setConsecutiveCorrectAnswers(0);
    
    // Emit progress
    emitProgress({ 
      correct: false, 
      timeSpent, 
      levelInfo: currentLevelInfo,
      attempts: attemptsCounted, 
      revealed: true,
      useFactors: useFactors
    });
    
    // Add compensation if enabled
    if (settings.enableCompensation) {
      setTargetProblemCount(prev => prev + 1);
      toast.info("Revealed answer, adding one more problem.", { duration: 2000 });
    }
    
    // Clear error and continue
    setError('');
    triggerContinuation();
  };

  // Handle answer verification
  const handleCheckAnswer = () => {
    if (!selectedShape || isSubmitting.current || isAnswerRevealed) return;
    isSubmitting.current = true;
    setError('');
    
    // Validate area and perimeter inputs
    if (!areaInput.trim() || !perimeterInput.trim()) {
      setError('Please enter both area and perimeter');
      isSubmitting.current = false;
      return;
    }
    
    const userArea = parseFloat(areaInput);
    const userPerimeter = parseFloat(perimeterInput);
    
    if (isNaN(userArea) || isNaN(userPerimeter)) {
      setError('Please enter valid numbers');
      isSubmitting.current = false;
      return;
    }
    
    // Calculate correct answers
    const calculatedResults = calculateResults();
    if (!calculatedResults) {
      isSubmitting.current = false;
      return;
    }
    
    // Set results to display
    setResults(calculatedResults);
    
    // Check accuracy (allow 2% error)
    const areaCorrect = Math.abs(userArea - calculatedResults.area) / calculatedResults.area < 0.02;
    const perimeterCorrect = Math.abs(userPerimeter - calculatedResults.perimeter) / calculatedResults.perimeter < 0.02;
    const isCorrect = areaCorrect && perimeterCorrect;
    
    // Update attempts
    const attemptsSoFar = currentAttempts + 1;
    setCurrentAttempts(attemptsSoFar);
    
    const timeSpent = (Date.now() - problemStartTime) / 1000;
    
    // Extract values for answer record
    const shape = shapes[selectedShape];
    const numericValues = shape.inputs.map(input => {
      const val = parseFloat(inputValues[input] || '0');
      return isNaN(val) ? 0 : val;
    });
    
    if (isCorrect) {
      // Correct answer
      let feedbackMessage = `Correct! (${attemptsSoFar} ${attemptsSoFar === 1 ? 'attempt' : 'attempts'})`;
      setFeedback({ correct: true, message: feedbackMessage });
      
      // Register answer
      setUserAnswers(prev => [...prev, { 
        shape: selectedShape,
        levelInfo: { ...currentLevelInfo },
        inputValues: numericValues,
        results: calculatedResults,
        userArea,
        userPerimeter,
        isCorrect: true, 
        wasRevealed: false,
        timeSpent, 
        attemptsMade: attemptsSoFar,
        useFactors: useFactors
      }]);
      
      // Emit progress
      emitProgress({ 
        correct: true, 
        timeSpent, 
        levelInfo: currentLevelInfo,
        attempts: attemptsSoFar, 
        revealed: false,
        useFactors: useFactors
      });
      
      // Update consecutive correct answers
      const newCorrectAnswers = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newCorrectAnswers);
      
      // Activar factores si aplica: a partir del nivel 4 con 5+ respuestas correctas
      if (currentLevelInfo.mainLevel >= 4 && 
          newCorrectAnswers >= FACTOR_ACTIVATION_THRESHOLD && 
          !useFactors && 
          !settings.enableFactors) {
        setUseFactors(true);
        toast.success("Complexity factors activated! Calculations now include multipliers.", { duration: 3000 });
      }
      
      // Verificar si debemos avanzar de nivel/subnivel (después de 3 correctas)
      if (newCorrectAnswers >= CORRECT_STREAK_THRESHOLD) {
        advanceLevel();
        setConsecutiveCorrectAnswers(0);
        toast.success(`Advanced to level ${formatLevel(currentLevelInfo)}!`, { duration: 2500 });
      }
      
      triggerContinuation();
    } else {
      // Incorrect answer
      setConsecutiveCorrectAnswers(0);
      
      const hasAttemptsLeft = settings.maxAttempts === 0 || attemptsSoFar < settings.maxAttempts;
      
      if (hasAttemptsLeft) {
        // Still has attempts
        const attemptsRemaining = settings.maxAttempts === 0 ? 'Unlimited' : settings.maxAttempts - attemptsSoFar;
        setError(`Incorrect. Attempts left: ${attemptsRemaining}`);
        setFeedback({ correct: false, message: 'Incorrect. Try again!' });
        isSubmitting.current = false;
      } else {
        // No more attempts
        setFeedback({ 
          correct: false, 
          message: `Incorrect. No attempts left. The area was ${calculatedResults.area.toFixed(2)} and the perimeter was ${calculatedResults.perimeter.toFixed(2)}.` 
        });
        
        // Register incorrect answer
        setUserAnswers(prev => [...prev, { 
          shape: selectedShape,
          levelInfo: { ...currentLevelInfo },
          inputValues: numericValues,
          results: calculatedResults,
          userArea,
          userPerimeter,
          isCorrect: false, 
          wasRevealed: false,
          timeSpent, 
          attemptsMade: attemptsSoFar,
          useFactors: useFactors
        }]);
        
        // Emit progress
        emitProgress({ 
          correct: false, 
          timeSpent, 
          levelInfo: currentLevelInfo,
          attempts: attemptsSoFar, 
          revealed: false,
          useFactors: useFactors
        });
        
        // Add compensation if enabled
        if (settings.enableCompensation) {
          setTargetProblemCount(prev => prev + 1);
          toast.info("Incorrect answer, adding one more problem.", { duration: 2000 });
        }
        
        triggerContinuation();
      }
    }
  };

  // Prepare to continue
  const triggerContinuation = () => {
    if (isAutoContinueEnabled && !isReviewMode) {
      setShowContinueButton(true);
    } else {
      setShowContinueButton(true);
    }
  };

  // Continue to next problem
  const handleContinue = useCallback(() => {
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }

    if (currentIndex >= targetProblemCount - 1) {
      setIsComplete(true);
      setShowContinueButton(false);
      setIsReviewMode(false);
      return;
    }

    setSelectedShape(null);
    setInputValues({});
    setAreaInput('');
    setPerimeterInput('');
    setResults(null);
    setError('');
    setFeedback(null);
    setCurrentIndex(prev => prev + 1);
    setShowContinueButton(false);
    isSubmitting.current = false;
  }, [currentIndex, targetProblemCount]);

  // Handle auto-continue toggle
  const handleAutoContinueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsAutoContinueEnabled(isChecked);

    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);

    if (isChecked) {
      setShowAutoContinueTooltip(true);
      tooltipTimerRef.current = setTimeout(() => setShowAutoContinueTooltip(false), TOOLTIP_DISPLAY_TIME);
    } else {
      setShowAutoContinueTooltip(false);
      if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
        if (showContinueButton && !isComplete) {
          setShowContinueButton(true);
        }
      }
    }
  };

  // Review functions
  const handleCheckboxAreaClick = (e: React.MouseEvent) => e.stopPropagation();
  
  const handleEnterReview = () => {
    if (userAnswers.length === 0) return;
    setIsReviewMode(true);
    setReviewIndex(userAnswers.length - 1);
    setShowContinueButton(false);
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }
  };

  const handleExitReview = () => {
    setIsReviewMode(false);
    if (showContinueButton && isAutoContinueEnabled && !isComplete) {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY);
    }
    if (!showContinueButton && !isComplete) {
      inputRef.current?.focus();
    }
  };

  const handleReviewNext = () => {
    setReviewIndex(prev => Math.min(prev + 1, userAnswers.length - 1));
  };

  const handleReviewPrev = () => {
    setReviewIndex(prev => Math.max(prev - 1, 0));
  };

  // Render review screen
  const renderReviewScreen = () => {
    if (!isReviewMode || userAnswers.length === 0) return null;
    const reviewAnswer = userAnswers[reviewIndex];
    if (!reviewAnswer) return <div>Error: Review data not found.</div>;

    const { 
      shape, 
      levelInfo,
      inputValues, 
      results, 
      userArea, 
      userPerimeter, 
      isCorrect, 
      wasRevealed, 
      timeSpent, 
      attemptsMade,
      useFactors
    } = reviewAnswer;

    const shapeData = shapes[shape];
    
    // Render results based on answer type
    const renderResults = () => {
      if (wasRevealed) {
        return (
          <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-md">
            <p className="text-orange-700 dark:text-orange-300 font-semibold mb-1">Answer was revealed:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Area:</p>
                <p className="text-lg font-mono font-bold text-orange-600 dark:text-orange-300">
                  {results.area.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Perimeter:</p>
                <p className="text-lg font-mono font-bold text-orange-600 dark:text-orange-300">
                  {results.perimeter.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        );
      }

      if (isCorrect) {
        return (
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-md">
            <p className="text-green-700 dark:text-green-300 font-semibold mb-1">Correct answer:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Area:</p>
                <p className="text-lg font-mono font-bold text-green-600 dark:text-green-300">
                  {userArea?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Perimeter:</p>
                <p className="text-lg font-mono font-bold text-green-600 dark:text-green-300">
                  {userPerimeter?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-300 font-semibold mb-1">Your incorrect answer:</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Area:</p>
              <div className="flex items-center">
                <p className="text-lg font-mono font-bold text-red-500 dark:text-red-400 line-through mr-2">
                  {userArea?.toFixed(2)}
                </p>
                <p className="text-sm font-mono text-green-600 dark:text-green-300">
                  ({results.area.toFixed(2)})
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Perimeter:</p>
              <div className="flex items-center">
                <p className="text-lg font-mono font-bold text-red-500 dark:text-red-400 line-through mr-2">
                  {userPerimeter?.toFixed(2)}
                </p>
                <p className="text-sm font-mono text-green-600 dark:text-green-300">
                  ({results.perimeter.toFixed(2)})
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <motion.div
        key="review-overlay"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-white dark:bg-gray-800 p-6 rounded-xl z-20 flex flex-col shadow-2xl border dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">
          Reviewing Problem {reviewIndex + 1} / {userAnswers.length}
        </h3>
        
        <div className="mb-4">
          <ShapeVisual 
            shape={shape} 
            size={200} 
            values={inputValues} 
            useFactors={useFactors}
            levelInfo={levelInfo}
          />
        </div>
        
        {renderResults()}
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center border-t dark:border-gray-700 pt-3 space-y-1">
          <p>Level: {formatLevel(levelInfo)}</p>
          {useFactors && <p>Using complexity factors</p>}
          {!wasRevealed && <p>Attempts: {attemptsMade}</p>}
          <p>Time: {timeSpent.toFixed(1)}s</p>
        </div>
        
        <div className="mt-auto flex justify-between items-center pt-4">
          <button 
            onClick={handleReviewPrev} 
            disabled={reviewIndex === 0} 
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-colors"
            aria-label="Previous problem"
          >
            <ArrowLeft size={14} /> Prev
          </button>
          
          <button 
            onClick={handleExitReview} 
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            aria-label="Return to exercise"
          >
            Return to Exercise
          </button>
          
          <button 
            onClick={handleReviewNext} 
            disabled={reviewIndex === userAnswers.length - 1} 
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-colors"
            aria-label="Next problem"
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    );
  };

  // Render completion screen
  if (isComplete) {
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const revealedCount = userAnswers.filter(a => a.wasRevealed).length;
    const finalProblemCount = userAnswers.length;
    const accuracy = finalProblemCount > 0 ? (correctCount / finalProblemCount) * 100 : 0;
    const totalTime = userAnswers.reduce((acc, a) => acc + a.timeSpent, 0);
    const avgTime = finalProblemCount > 0 ? totalTime / finalProblemCount : 0;
    const totalAttempts = userAnswers.reduce((acc, a) => acc + a.attemptsMade, 0);
    const avgAttempts = finalProblemCount > 0 ? totalAttempts / finalProblemCount : 0;
    const finalLevelInfo = userAnswers.length > 0 ? userAnswers[userAnswers.length - 1].levelInfo : settings.startingLevel;
    const problemsWithFactors = userAnswers.filter(a => a.useFactors).length;

    // Render summary items
    const renderSummaryItem = (answer: UserAnswer, index: number) => {
      const { 
        shape, 
        levelInfo,
        results, 
        userArea, 
        userPerimeter, 
        isCorrect, 
        wasRevealed, 
        timeSpent, 
        attemptsMade,
        useFactors
      } = answer;
      
      const shapeData = shapes[shape];
      
      let statusIcon: React.ReactNode;
      if (wasRevealed) {
        statusIcon = (
          <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      } else if (isCorrect) {
        statusIcon = (
          <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      } else {
        statusIcon = (
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.607a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      }

      return (
        <div 
          key={index} 
          className={`p-3 rounded-md shadow-sm ${
            isCorrect 
              ? 'bg-green-100 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-700' 
              : wasRevealed 
                ? 'bg-orange-100 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-700' 
                : 'bg-red-100 dark:bg-red-900/30 ring-1 ring-red-200 dark:ring-red-700'
          }`}
        >
          <div className="flex justify-between items-start text-sm">
            <div className="text-left flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">(#{index + 1})</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {shapeData.icon}
                </span>
                <span className="font-semibold">{shapeData.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatLevel(levelInfo)} {useFactors && "⚡"}
                </span>
              </div>
              
              <p className="font-medium text-gray-800 dark:text-gray-100 flex flex-wrap items-center gap-x-1 text-xs sm:text-sm">
                {isCorrect ? (
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    A: {userArea?.toFixed(2)}, P: {userPerimeter?.toFixed(2)}
                  </span>
                ) : wasRevealed ? (
                  <span className="font-semibold text-orange-700 dark:text-orange-400">
                    Revealed: A: {results.area.toFixed(2)}, P: {results.perimeter.toFixed(2)}
                  </span>
                ) : (
                  <span className="font-semibold line-through text-red-700 dark:text-red-400">
                    A: {userArea?.toFixed(2)}, P: {userPerimeter?.toFixed(2)}
                    <span className="ml-1 text-xs text-green-600 dark:text-green-400 no-underline">
                      (A: {results.area.toFixed(2)}, P: {results.perimeter.toFixed(2)})
                    </span>
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {`Att: ${attemptsMade}, T: ${timeSpent.toFixed(1)}s`}
              </p>
            </div>
            <div className="text-right pl-2 shrink-0">{statusIcon}</div>
          </div>
        </div>
      );
    };

    return (
      <div className="max-w-lg mx-auto text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Geometry Exercise Complete!</h2>
        <div className="bg-indigo-50 dark:bg-gray-900/50 p-6 rounded-lg mb-6 ring-1 ring-inset ring-indigo-100 dark:ring-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Score</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{correctCount} / {finalProblemCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Accuracy</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{accuracy.toFixed(1)}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Time</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgTime.toFixed(1)}s</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Attempts</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgAttempts.toFixed(1)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Revealed</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{revealedCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Final Level</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatLevel(finalLevelInfo)}</p>
            </div>
            
            {problemsWithFactors > 0 && (
              <div className="col-span-2 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-md text-sm text-blue-800 dark:text-blue-200">
                {problemsWithFactors} problem(s) used complexity factors.
              </div>
            )}
            
            {settings.enableCompensation && finalProblemCount > settings.problemCount && (
              <div className="col-span-2 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                {finalProblemCount - settings.problemCount} extra problem(s) added due to compensation.
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Problem Review</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
            {userAnswers.map((answer, index) => renderSummaryItem(answer, index))}
          </div>
        </div>
        
        <button 
          onClick={() => setSettings(prev => ({ ...prev }))} 
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 flex items-center justify-center gap-2 mx-auto"
        >
          <RotateCcw size={16} /> Start New Exercise
        </button>
      </div>
    );
  }

  // Render main exercise interface
  return (
    <div className="max-w-4xl mx-auto p-4 relative min-h-[32rem]">
      {!selectedShape && !isComplete && !isReviewMode && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">
            Select a Shape (Level {formatLevel(currentLevelInfo)})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {availableShapes.map(shapeKey => (
              <button
                key={shapeKey}
                onClick={() => handleShapeSelect(shapeKey)}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-3"
              >
                <div className="text-indigo-600 dark:text-indigo-400">
                  {shapes[shapeKey].icon}
                </div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  {shapes[shapeKey].name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <AnimatePresence>
        {isReviewMode && renderReviewScreen()}
      </AnimatePresence>
      
      <AnimatePresence>
        {!isReviewMode && selectedShape && (
          <motion.div
            key={`active-exercise-${currentIndex}-${selectedShape}-${formatLevel(currentLevelInfo)}-${useFactors}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2 text-sm">
                <button
                  onClick={handleEnterReview}
                  disabled={userAnswers.length === 0}
                  className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Review Previous Problems" 
                  title="Review Previous Problems"
                >
                  <Eye size={18} />
                </button>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Problem {currentIndex + 1} of {targetProblemCount}
                </span>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 mr-3">
                    Level: <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                      {formatLevel(currentLevelInfo)}
                    </span>
                    {useFactors && <span className="ml-1 text-yellow-500">⚡</span>}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Att: {currentAttempts} / {settings.maxAttempts === 0 ? '∞' : settings.maxAttempts}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${((currentIndex + 1) / targetProblemCount) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              
              <div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                <span>
                  Streak: {consecutiveCorrectAnswers}/
                  {currentLevelInfo.mainLevel >= 4 && !useFactors && !settings.enableFactors 
                    ? FACTOR_ACTIVATION_THRESHOLD
                    : CORRECT_STREAK_THRESHOLD}
                </span>
                {currentLevelInfo.mainLevel >= 4 && !useFactors && !settings.enableFactors && (
                  <span className="ml-2 text-yellow-500">
                    ({FACTOR_ACTIVATION_THRESHOLD - consecutiveCorrectAnswers} more for factors)
                  </span>
                )}
                {useFactors && <span className="ml-2 text-yellow-500">Complexity factors active!</span>}
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-6 text-center border border-gray-200 dark:border-gray-700 relative"
            >
              <div className="mb-6">
                {selectedShape && (
                  <ShapeVisual 
                    shape={selectedShape} 
                    size={200} 
                    useFactors={useFactors}
                    levelInfo={currentLevelInfo}
                    values={
                      shapes[selectedShape].inputs.map(input => {
                        const val = parseFloat(inputValues[input] || '0');
                        if (isNaN(val) || val <= 0) {
                          const defaultValues = shapes[selectedShape].getDefaultValues(currentLevelInfo.subLevel);
                          return defaultValues[shapes[selectedShape].inputs.indexOf(input)];
                        }
                        return val;
                      })
                    }
                  />
                )}
              </div>
              
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key={`feedback-${currentIndex}-${feedback.correct}-${isAnswerRevealed}`}
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-3 rounded-md text-sm font-medium overflow-hidden ${
                      feedback.correct 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800/80 dark:text-green-100' 
                        : isAnswerRevealed 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-800/80 dark:text-orange-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800/80 dark:text-red-100'
                    }`}
                  >
                    {feedback.message}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence mode="wait">
                {!showContinueButton ? (
                  <motion.div 
                    key="input-form" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                          Measurements
                        </h3>
                        <div className="space-y-4">
                          {shapes[selectedShape].inputs.map((input, idx) => (
                            <div key={input}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {input}
                              </label>
                              <input
                                ref={idx === 0 ? inputRef : undefined}
                                type="number"
                                value={inputValues[input] || ''}
                                onChange={(e) => handleInputChange(input, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder={`Enter ${input.toLowerCase()}`}
                                step="any"
                                disabled={isAnswerRevealed}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                          Calculate Area & Perimeter
                        </h3>
                        
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Area Formula:</p>
                            <p className="text-lg font-mono">{shapes[selectedShape].formulas(useFactors, currentLevelInfo).area}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Perimeter Formula:</p>
                            <p className="text-lg font-mono">{shapes[selectedShape].formulas(useFactors, currentLevelInfo).perimeter}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Area
                            </label>
                            <input
                              type="number"
                              value={areaInput}
                              onChange={(e) => setAreaInput(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="Your calculated area"
                              step="any"
                              disabled={isAnswerRevealed}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Perimeter
                            </label>
                            <input
                              type="number"
                              value={perimeterInput}
                              onChange={(e) => setPerimeterInput(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="Your calculated perimeter"
                              step="any"
                              disabled={isAnswerRevealed}
                            />
                          </div>
                          
                          <button
                            onClick={handleCheckAnswer}
                            disabled={isAnswerRevealed}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                          >
                            Check Answer
                          </button>
                          
                          {!isAnswerRevealed && (
                            <button 
                              onClick={handleShowAnswer} 
                              className="w-full px-4 py-2 mt-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 dark:focus:ring-offset-gray-800"
                            >
                              <span className="flex items-center justify-center gap-1">
                                <EyeIcon size={16} /> Show Answer
                              </span>
                            </button>
                          )}
                          
                          {error && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="continue-button" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.2 }} 
                    className="mt-8"
                  >
                    <motion.button 
                      onClick={handleContinue} 
                      className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 relative overflow-hidden transition-colors"
                    >
                      <span className="relative z-0">
                        {currentIndex < targetProblemCount - 1 ? 'Continue' : 'Show Results'}
                      </span>
                      <div 
                        className="absolute bottom-0 right-0 mb-1 mr-1 flex items-center z-10 group" 
                        onClick={handleCheckboxAreaClick}
                      >
                        <AnimatePresence>
                          {showAutoContinueTooltip && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute bottom-full right-0 mb-1 p-1.5 bg-gray-900 text-white text-xs rounded shadow-lg w-max max-w-[180px] pointer-events-none"
                              role="tooltip"
                              id="auto-continue-tooltip"
                            >
                              Auto-proceeds after {AUTO_CONTINUE_DELAY / 1000}s
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <label 
                          htmlFor="auto-continue-checkbox" 
                          className="flex items-center px-1.5 py-0.5 bg-white/80 dark:bg-black/50 rounded cursor-pointer hover:bg-white dark:hover:bg-black/70 backdrop-blur-sm transition-colors"
                        >
                          <input
                            type="checkbox"
                            id="auto-continue-checkbox"
                            checked={isAutoContinueEnabled}
                            onChange={handleAutoContinueChange}
                            className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-1 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800"
                            aria-describedby={showAutoContinueTooltip ? "auto-continue-tooltip" : undefined}
                          />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 select-none">Auto</span>
                        </label>
                      </div>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};