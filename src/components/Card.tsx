interface CardProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className }) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      <div>{children}</div>
    </div>
  );
};

export default Card; 