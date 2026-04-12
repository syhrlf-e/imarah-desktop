interface Props {
    role: string;
}

export default function RoleBadge({ role }: Props) {
    const getStyle = (r: string) => {
        switch (r) {
            case "super_admin":
                return "bg-purple-100 text-purple-800";
            case "bendahara":
                return "bg-blue-100 text-blue-800";
            case "petugas_zakat":
                return "bg-green-100 text-green-800";
            case "viewer":
            default:
                return "bg-slate-100 text-slate-800";
        }
    };

    const formatRole = (r: string) => {
        return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStyle(role)} capitalize`}
        >
            {formatRole(role)}
        </span>
    );
}
