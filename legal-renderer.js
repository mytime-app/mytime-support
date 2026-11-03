(() => {
    "use strict";

    const documentKey = document.body.dataset.legalDocument;
    if (!documentKey) return;

    const contents = document.getElementById("legal-contents");
    const sectionsContainer = document.getElementById("legal-sections");
    const version = document.getElementById("legal-version");
    const effectiveDate = document.getElementById("legal-effective");

    if (!contents || !sectionsContainer || !version || !effectiveDate) return;

    const slug = (title, index) => {
        const value = title
            .toLocaleLowerCase("en-US")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        return value || `section-${index + 1}`;
    };

    const paragraph = text => {
        const element = document.createElement("p");
        element.textContent = text;
        return element;
    };

    const render = legalDocument => {
        if (
            typeof legalDocument.version !== "string" ||
            typeof legalDocument.effectiveDate !== "string" ||
            !Array.isArray(legalDocument.sections)
        ) {
            throw new Error("The legal manifest has an invalid document shape.");
        }

        version.textContent = legalDocument.version;
        effectiveDate.textContent = legalDocument.effectiveDate;

        const navigationFragment = document.createDocumentFragment();
        const navigationHeading = document.createElement("p");
        navigationHeading.textContent = "On this page";
        navigationFragment.append(navigationHeading);

        const sectionsFragment = document.createDocumentFragment();
        const usedIDs = new Set();

        legalDocument.sections.forEach((item, index) => {
            if (!item || typeof item.title !== "string" || typeof item.body !== "string") {
                throw new Error(`The legal manifest has an invalid section at index ${index}.`);
            }

            let id = slug(item.title, index);
            while (usedIDs.has(id)) id = `${id}-${index + 1}`;
            usedIDs.add(id);

            const link = document.createElement("a");
            link.href = `#${id}`;
            link.textContent = item.title;
            navigationFragment.append(link);

            const section = document.createElement("section");
            section.id = id;

            const heading = document.createElement("h2");
            heading.textContent = item.title;
            section.append(heading);

            item.body
                .split(/\n\s*\n/)
                .filter(Boolean)
                .forEach(value => section.append(paragraph(value)));

            if (item.title.toLocaleLowerCase("en-US") === "contact") {
                section.classList.add("contact-section", "generated-contact");
                const email = document.createElement("a");
                email.className = "email-button";
                email.href = "mailto:mytime.watchapp@gmail.com";
                email.textContent = "mytime.watchapp@gmail.com";
                section.append(email);
            }

            sectionsFragment.append(section);
        });

        contents.replaceChildren(navigationFragment);
        sectionsContainer.replaceChildren(sectionsFragment);
        document.documentElement.dataset.legalSource = "manifest";
    };

    fetch("legal.json", { cache: "no-store" })
        .then(response => {
            if (!response.ok) throw new Error(`legal.json returned ${response.status}`);
            return response.json();
        })
        .then(manifest => {
            const legalDocument = manifest[documentKey];
            if (!legalDocument) throw new Error(`legal.json has no ${documentKey} document.`);
            render(legalDocument);
        })
        .catch(error => {
            // The checked-in HTML remains visible as an offline/no-JavaScript fallback.
            document.documentElement.dataset.legalSource = "fallback";
            console.error("Could not load legal.json; showing the built-in legal copy.", error);
        });
})();
