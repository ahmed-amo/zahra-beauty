export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md">
                <img src="/logo-zahra-black.png" alt="" className="size-8 object-contain dark:hidden" />
                <img src="/logo-zahra-gold.png" alt="" className="hidden size-8 object-contain dark:block" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">Zahra</span>
            </div>
        </>
    );
}
