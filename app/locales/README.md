# Translation Key Structure

Translations are organized by namespace using dot notation. Current namespaces:

- `common`: Shared UI strings such as buttons and generic labels (`common.add`, `common.cancel`).
- `nav`: Navigation actions (`nav.back`).
- `server`: Text related to server management. Includes a nested `server.delete` group for the deletion dialog (`server.add`, `server.delete.confirm`).
- `terms`: Short nouns used for counts (`terms.server`, `terms.servers`).

Use these identifiers with the `t()` helper in components.
