import { useNavigate, useParams } from '@solidjs/router';
import { createEffect, createResource } from 'solid-js';
import { useFiles } from '../context/FilesContext.jsx';
import { getFileRouteFromFile } from '../utils/fileMode.js';

export default function ViewRedirect() {
    const params = useParams();
    const navigate = useNavigate();
    const { getFileFromAnyStorage } = useFiles();
    const [file] = createResource(() => params.id, getFileFromAnyStorage);

    createEffect(() => {
        const entry = file();
        if (!entry?.id) return;

        navigate(getFileRouteFromFile(entry), { replace: true });
    });

    return 'Loading file...';
}
