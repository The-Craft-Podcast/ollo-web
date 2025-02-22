import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-muted py-4 px-4 md:px-6 w-full">
            <div className="container flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Copyright &copy; OllO Audio 2024</p>
                <div className="flex gap-4">
                    <Link href="/terms" className="text-sm hover:underline" prefetch={false}>
                        Terms & Conditions
                    </Link>
                    <Link href="/privacy" className="text-sm hover:underline" prefetch={false}>
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </footer>
    );
}
