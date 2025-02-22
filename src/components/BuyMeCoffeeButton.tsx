'use client';

export default function BuyMeCoffeeButton() {
    return (
        <div className="fixed right-[18px] bottom-[18px] z-[9999] transition-transform hover:-translate-y-1">
            <a
                href="https://www.buymeacoffee.com/ollolabs"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png"
                    alt="Buy Us A Coffee"
                    className="h-[60px] w-[217px]"
                />
            </a>
        </div>
    );
} 