import { getCurrentWindow } from "@tauri-apps/api/window";
import "../App.css";

interface TitleBarProps {
  isHovered: boolean;
  title: string;
}

export const TitleBar = ({ isHovered, title }: TitleBarProps) => {
  const appWindow = getCurrentWindow();

  const handleMouseEnter = async () => {
    await appWindow.setFocus();
  };

  return (
    <div
      data-tauri-drag-region
      onMouseEnter={handleMouseEnter}
      className="h-10 shrink-0 flex items-center px-4 relative"
    >
      {isHovered && (
        <div className="flex gap-2 z-10 select-none group">
          <button
            onClick={() => appWindow.close()}
            className="w-3 h-3 rounded-full bg-[#393c41] group-hover:bg-[#ff5f56] transition-colors duration-200"
          />
          <button
            onClick={() => appWindow.minimize()}
            className="w-3 h-3 rounded-full bg-[#393c41] group-hover:bg-[#ffbd2e] transition-colors duration-200"
          />
          <button
            onClick={() => appWindow.toggleMaximize()}
            className="w-3 h-3 rounded-full bg-[#393c41] group-hover:bg-[#27c93f] transition-colors duration-200"
          />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm text-(--muted) font-medium">{title}</span>
      </div>
    </div>
  );
};
