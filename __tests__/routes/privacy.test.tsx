import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import PrivacyPolicyPage, { meta } from '~/routes/privacy';

/**
 * Test suite for Privacy Policy page
 *
 * This test suite verifies the privacy policy page renders correctly with all
 * required sections, particularly focusing on the children's data protection
 * section and GDPR compliance information.
 */
describe('Privacy Policy Page', () => {
  /**
   * Helper to render the privacy policy page with routing context
   */
  const renderPrivacyPage = () => {
    const routes = [
      {
        path: '/',
        element: <div>Home</div>,
      },
      {
        path: '/privacy',
        element: <PrivacyPolicyPage />,
      },
    ];

    const router = createMemoryRouter(routes, {
      initialEntries: ['/privacy'],
    });

    return render(<RouterProvider router={router} />);
  };

  describe('Meta Tags', () => {
    it('has correct page title', () => {
      const metaTags = meta();

      const titleTag = metaTags.find((tag) => tag.title);
      expect(titleTag?.title).toBe('Privacy Policy - AIPrintly');
    });

    it('has correct meta description', () => {
      const metaTags = meta();

      const descriptionTag = metaTags.find(
        (tag) => tag.name === 'description'
      );
      expect(descriptionTag?.content).toBe(
        'Learn how AIPrintly collects, uses, and protects your personal data. GDPR compliant privacy policy.'
      );
    });
  });

  describe('Page Header', () => {
    it('renders the page with Privacy Policy heading', () => {
      renderPrivacyPage();

      const heading = screen.getByRole('heading', {
        name: /privacy policy/i,
        level: 1,
      });
      expect(heading).toBeInTheDocument();
    });

    it('renders last updated date', () => {
      renderPrivacyPage();

      const lastUpdated = screen.getByText(/last updated: 23 january 2026/i);
      expect(lastUpdated).toBeInTheDocument();
    });

    it('has Shield icon in header', () => {
      renderPrivacyPage();

      const header = screen
        .getByRole('heading', { name: /privacy policy/i })
        .closest('header');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Table of Contents', () => {
    it('renders table of contents navigation', () => {
      renderPrivacyPage();

      const navs = screen.getAllByRole('navigation', {
        name: /table of contents/i,
      });
      expect(navs.length).toBeGreaterThan(0);
    });

    it('renders Contents heading in table of contents', () => {
      renderPrivacyPage();

      const navs = screen.getAllByRole('navigation', {
        name: /table of contents/i,
      });
      const heading = within(navs[0]).getByRole('heading', {
        name: /contents/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it('table of contents links have correct href anchors', () => {
      renderPrivacyPage();

      const navs = screen.getAllByRole('navigation', {
        name: /table of contents/i,
      });
      const nav = navs[0];

      const introductionLink = within(nav).getByRole('link', {
        name: /1\. introduction/i,
      });
      expect(introductionLink).toHaveAttribute('href', '#introduction');

      const childrensDataLink = within(nav).getByRole('link', {
        name: /4\. children's data/i,
      });
      expect(childrensDataLink).toHaveAttribute('href', '#childrens-data');

      const contactLink = within(nav).getByRole('link', {
        name: /10\. contact us/i,
      });
      expect(contactLink).toHaveAttribute('href', '#contact');
    });

    it('all 10 sections are listed in table of contents', () => {
      renderPrivacyPage();

      const navs = screen.getAllByRole('navigation', {
        name: /table of contents/i,
      });
      const nav = navs[0];

      const links = within(nav).getAllByRole('link');
      expect(links).toHaveLength(10);

      expect(
        within(nav).getByRole('link', { name: /1\. introduction/i })
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole('link', {
          name: /2\. information we collect/i,
        })
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole('link', {
          name: /3\. how we use your information/i,
        })
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole('link', { name: /4\. children's data/i })
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole('link', { name: /5\. data retention/i })
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole('link', { name: /6\. your rights \(gdpr\)/i })
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole('link', { name: /7\. data security/i })
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole('link', { name: /8\. cookies/i })
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole('link', { name: /9\. third parties/i })
      ).toBeInTheDocument();
      expect(
        within(nav).getByRole('link', { name: /10\. contact us/i })
      ).toBeInTheDocument();
    });
  });

  describe('Section Headings', () => {
    it('renders all 10 section headings', () => {
      renderPrivacyPage();

      expect(
        screen.getByRole('heading', { name: /1\. introduction/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /2\. information we collect/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /3\. how we use your information/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /4\. children's data/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /5\. data retention/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /6\. your rights \(gdpr\)/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /7\. data security/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /8\. cookies/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /9\. third parties/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /10\. contact us/i })
      ).toBeInTheDocument();
    });

    it('section headings have matching id attributes for anchor navigation', () => {
      renderPrivacyPage();

      const introductionHeading = screen.getByRole('heading', {
        name: /1\. introduction/i,
      });
      expect(introductionHeading).toHaveAttribute('id', 'introduction');

      const childrensDataHeading = screen.getByRole('heading', {
        name: /4\. children's data/i,
      });
      expect(childrensDataHeading).toHaveAttribute('id', 'childrens-data');

      const dataRetentionHeading = screen.getByRole('heading', {
        name: /5\. data retention/i,
      });
      expect(dataRetentionHeading).toHaveAttribute('id', 'data-retention');

      const yourRightsHeading = screen.getByRole('heading', {
        name: /6\. your rights \(gdpr\)/i,
      });
      expect(yourRightsHeading).toHaveAttribute('id', 'your-rights');

      const contactHeading = screen.getByRole('heading', {
        name: /10\. contact us/i,
      });
      expect(contactHeading).toHaveAttribute('id', 'contact');
    });
  });

  describe("Children's Data Section", () => {
    it("renders Children's Data section with warning styling", () => {
      renderPrivacyPage();

      const heading = screen.getByRole('heading', {
        name: /4\. children's data/i,
      });
      const section = heading.closest('section');
      const highlightedContainer = section?.querySelector(
        '.border-2.border-amber-300'
      );

      expect(highlightedContainer).toBeInTheDocument();
    });

    it("Children's section contains never used for AI training text", () => {
      renderPrivacyPage();

      expect(
        screen.getByText(/your photos are never used to train ai models/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /we do not use any uploaded images.*to train.*generation systems/i
        )
      ).toBeInTheDocument();
    });

    it('contains parental consent requirement text', () => {
      renderPrivacyPage();

      expect(
        screen.getByText(
          /if you upload photos featuring children.*parental or guardian consent/i
        )
      ).toBeInTheDocument();
    });

    it('contains 30-day deletion policy text', () => {
      renderPrivacyPage();

      const deletionText = screen.getByText(
        /automatically deleted within 30 days/i
      );
      expect(deletionText).toBeInTheDocument();
    });

    it("contains link to ICO Children's Code", () => {
      renderPrivacyPage();

      const icoLink = screen.getByRole('link', {
        name: /ico children's code hub/i,
      });
      expect(icoLink).toBeInTheDocument();
      expect(icoLink).toHaveAttribute(
        'href',
        'https://ico.org.uk/for-organisations/childrens-code-hub/'
      );
      expect(icoLink).toHaveAttribute('target', '_blank');
      expect(icoLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('has visual emphasis with different background and border', () => {
      renderPrivacyPage();

      const section = screen
        .getByRole('heading', { name: /4\. children's data/i })
        .closest('section');

      const highlightedContainer = section?.querySelector(
        '.border-2.border-amber-300.bg-amber-50'
      );
      expect(highlightedContainer).toBeInTheDocument();
    });

    it("contains AlertTriangle icon in children's section", () => {
      renderPrivacyPage();

      const section = screen
        .getByRole('heading', { name: /4\. children's data/i })
        .closest('section');

      expect(section).toBeInTheDocument();
    });

    it('contains age requirements subsection', () => {
      renderPrivacyPage();

      const ageRequirementsHeading = screen.getByRole('heading', {
        name: /age requirements/i,
      });
      expect(ageRequirementsHeading).toBeInTheDocument();

      const under13Text = screen.getByText(
        /we do not knowingly collect personal data from children under 13/i
      );
      expect(under13Text).toBeInTheDocument();
    });

    it('contains parental rights subsection', () => {
      renderPrivacyPage();

      const parentalRightsHeading = screen.getByRole('heading', {
        name: /parental rights/i,
      });
      expect(parentalRightsHeading).toBeInTheDocument();

      const immediateDeletionText = screen.getByText(/immediate deletion/i);
      expect(immediateDeletionText).toBeInTheDocument();
    });
  });

  describe('Data Retention Table', () => {
    it('renders data retention table', () => {
      renderPrivacyPage();

      const dataTypeHeader = screen.getByRole('columnheader', {
        name: /data type/i,
      });
      const retentionPeriodHeader = screen.getByRole('columnheader', {
        name: /retention period/i,
      });

      expect(dataTypeHeader).toBeInTheDocument();
      expect(retentionPeriodHeader).toBeInTheDocument();
    });

    it('displays correct retention periods for different data types', () => {
      renderPrivacyPage();

      expect(
        screen.getByRole('cell', { name: /uploaded images \(unused\)/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('cell', {
          name: /30 days \(automatically deleted\)/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('cell', { name: /order images/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('cell', {
          name: /90 days after order completion/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('cell', { name: /ai generation jobs/i })
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('cell', { name: /^90 days$/i })
      ).toHaveLength(1);

      expect(
        screen.getByRole('cell', { name: /order records/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('cell', { name: /6 years \(hmrc legal requirement\)/i })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('cell', { name: /account data/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('cell', { name: /until you request deletion/i })
      ).toBeInTheDocument();
    });
  });

  describe('GDPR Rights Section', () => {
    it('renders GDPR rights list', () => {
      renderPrivacyPage();

      const section = screen
        .getByRole('heading', { name: /6\. your rights \(gdpr\)/i })
        .closest('section');

      expect(section).toBeInTheDocument();
    });

    it('contains all 6 GDPR rights', () => {
      renderPrivacyPage();

      expect(
        screen.getByRole('heading', { name: /right to access/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /right to rectification/i,
          level: 3,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /right to erasure/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /right to data portability/i,
          level: 3,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /right to object/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /right to withdraw consent/i,
          level: 3,
        })
      ).toBeInTheDocument();
    });

    it('contains descriptions for each GDPR right', () => {
      renderPrivacyPage();

      expect(
        screen.getByText(
          /you can request a copy of all personal data we hold about you/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /you can request that we correct any inaccurate or incomplete data/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/you can request deletion of your personal data/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /you can request your data in a machine-readable format/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /you can object to certain types of processing.*direct marketing/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/where we rely on consent.*withdraw it at any time/i)
      ).toBeInTheDocument();
    });

    it('contains privacy contact email for exercising rights', () => {
      renderPrivacyPage();

      const section = screen
        .getByRole('heading', { name: /6\. your rights \(gdpr\)/i })
        .closest('section');

      const privacyEmailLinks = within(section!).getAllByRole('link', {
        name: /privacy@aiprintly\.com/i,
      });
      expect(privacyEmailLinks.length).toBeGreaterThan(0);
      expect(privacyEmailLinks[0]).toHaveAttribute(
        'href',
        'mailto:privacy@aiprintly.com'
      );
    });
  });

  describe('Third Party Section', () => {
    it('renders third party provider links', () => {
      renderPrivacyPage();

      const stripeLink = screen.getByRole('link', {
        name: /stripe's privacy policy/i,
      });
      expect(stripeLink).toHaveAttribute('href', 'https://stripe.com/privacy');
      expect(stripeLink).toHaveAttribute('target', '_blank');

      const printfulLink = screen.getByRole('link', {
        name: /printful's privacy policy/i,
      });
      expect(printfulLink).toHaveAttribute(
        'href',
        'https://www.printful.com/policies/privacy'
      );
      expect(printfulLink).toHaveAttribute('target', '_blank');

      const blurbLink = screen.getByRole('link', {
        name: /blurb's privacy policy/i,
      });
      expect(blurbLink).toHaveAttribute('href', 'https://www.blurb.com/privacy');
      expect(blurbLink).toHaveAttribute('target', '_blank');

      const cloudflareLink = screen.getByRole('link', {
        name: /cloudflare's privacy policy/i,
      });
      expect(cloudflareLink).toHaveAttribute(
        'href',
        'https://www.cloudflare.com/privacypolicy/'
      );
      expect(cloudflareLink).toHaveAttribute('target', '_blank');
    });

    it('contains information about each third party service', () => {
      renderPrivacyPage();

      expect(
        screen.getByRole('heading', { name: /^stripe$/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/payment processing.*stripe processes/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('heading', { name: /^printful$/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/product fulfilment.*prints, mugs.*apparel/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('heading', { name: /^blurb$/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/storybook printing and fulfilment/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('heading', { name: /ai image provider/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/we send your text prompts to our ai provider/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('heading', { name: /^cloudflare$/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/content delivery and image storage/i)
      ).toBeInTheDocument();
    });
  });

  describe('Contact Section', () => {
    it('contains privacy contact email', () => {
      renderPrivacyPage();

      const section = screen
        .getByRole('heading', { name: /10\. contact us/i })
        .closest('section');

      const privacyEmailLinks = within(section!).getAllByRole('link', {
        name: /privacy@aiprintly\.com/i,
      });
      expect(privacyEmailLinks.length).toBeGreaterThan(0);
      expect(privacyEmailLinks[0]).toHaveAttribute(
        'href',
        'mailto:privacy@aiprintly.com'
      );
    });

    it('contains data protection officer email', () => {
      renderPrivacyPage();

      const dpoEmailLink = screen.getByRole('link', {
        name: /dpo@aiprintly\.com/i,
      });
      expect(dpoEmailLink).toBeInTheDocument();
      expect(dpoEmailLink).toHaveAttribute('href', 'mailto:dpo@aiprintly.com');
    });

    it('contains ICO complaint information', () => {
      renderPrivacyPage();

      const section = screen
        .getByRole('heading', { name: /10\. contact us/i })
        .closest('section');

      expect(
        within(section!).getByText(/lodge a complaint with the uk/i)
      ).toBeInTheDocument();

      const icoComplaintLink = screen.getByRole('link', {
        name: /ico\.org\.uk\/make-a-complaint/i,
      });
      expect(icoComplaintLink).toBeInTheDocument();
      expect(icoComplaintLink).toHaveAttribute(
        'href',
        'https://ico.org.uk/make-a-complaint/'
      );
      expect(icoComplaintLink).toHaveAttribute('target', '_blank');

      expect(screen.getByText(/0303 123 1113/i)).toBeInTheDocument();
    });

    it('contains contact section headings', () => {
      renderPrivacyPage();

      expect(
        screen.getByRole('heading', { name: /privacy enquiries/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /data protection contact/i,
          level: 3,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /^complaints$/i, level: 3 })
      ).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('Back to Home link points to /', () => {
      renderPrivacyPage();

      const backToHomeLink = screen.getByRole('link', {
        name: /back to home/i,
      });
      expect(backToHomeLink).toBeInTheDocument();
      expect(backToHomeLink).toHaveAttribute('href', '/');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy (h1 > h2)', () => {
      renderPrivacyPage();

      const h1 = screen.getByRole('heading', {
        name: /privacy policy/i,
        level: 1,
      });
      expect(h1).toBeInTheDocument();

      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings.length).toBeGreaterThan(0);

      const h3Headings = screen.getAllByRole('heading', { level: 3 });
      expect(h3Headings.length).toBeGreaterThan(0);
    });

    it('main content is in article element', () => {
      const { container } = renderPrivacyPage();

      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
      expect(article?.classList.contains('prose')).toBe(true);
    });

    it('navigation is in nav element', () => {
      renderPrivacyPage();

      const navs = screen.getAllByRole('navigation', {
        name: /table of contents/i,
      });
      expect(navs.length).toBeGreaterThan(0);
    });

    it('links have meaningful text (not "click here")', () => {
      renderPrivacyPage();

      const allLinks = screen.getAllByRole('link');

      allLinks.forEach((link) => {
        const linkText = link.textContent?.toLowerCase() || '';
        expect(linkText).not.toMatch(/^click here$/i);
        expect(linkText.trim().length).toBeGreaterThan(0);
      });
    });

    it('external links have target="_blank" and rel="noopener noreferrer"', () => {
      renderPrivacyPage();

      const externalLinks = [
        screen.getByRole('link', { name: /ico children's code hub/i }),
        screen.getByRole('link', { name: /stripe's privacy policy/i }),
        screen.getByRole('link', { name: /printful's privacy policy/i }),
        screen.getByRole('link', { name: /blurb's privacy policy/i }),
        screen.getByRole('link', { name: /cloudflare's privacy policy/i }),
        screen.getByRole('link', { name: /ico\.org\.uk\/make-a-complaint/i }),
      ];

      externalLinks.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Additional Content Sections', () => {
    it('renders Introduction section content', () => {
      renderPrivacyPage();

      expect(
        screen.getByText(/welcome to aiprintly.*aiprintly ltd/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/by using aiprintly.*you agree/i)
      ).toBeInTheDocument();
    });

    it('renders Information We Collect section with subsections', () => {
      renderPrivacyPage();

      expect(
        screen.getByRole('heading', { name: /account information/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /order information/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /uploaded content/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /usage data/i, level: 3 })
      ).toBeInTheDocument();
    });

    it('renders How We Use Your Information section', () => {
      renderPrivacyPage();

      expect(
        screen.getByRole('heading', { name: /to fulfil orders/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /to provide ai generation services/i,
          level: 3,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /to communicate with you/i,
          level: 3,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /to improve our services/i,
          level: 3,
        })
      ).toBeInTheDocument();
    });

    it('renders Data Security section with security measures', () => {
      renderPrivacyPage();

      expect(screen.getByText(/encryption in transit/i)).toBeInTheDocument();
      expect(screen.getByText(/https\/tls/i)).toBeInTheDocument();

      expect(screen.getByText(/secure payment processing/i)).toBeInTheDocument();
      expect(screen.getByText(/pci dss/i)).toBeInTheDocument();

      expect(screen.getByText(/encrypted storage/i)).toBeInTheDocument();

      expect(screen.getByText(/access controls/i)).toBeInTheDocument();
    });

    it('renders Cookies section with cookie types', () => {
      renderPrivacyPage();

      expect(
        screen.getByRole('heading', { name: /essential cookies/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /analytics cookies/i, level: 3 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/session cookies.*keep you logged in/i)
      ).toBeInTheDocument();
    });
  });

  describe('Visual Layout', () => {
    it('renders with responsive grid layout', () => {
      const { container } = renderPrivacyPage();

      const gridContainer = container.querySelector('.grid.gap-8');
      expect(gridContainer).toBeInTheDocument();
    });

    it('renders separators between sections', () => {
      const { container } = renderPrivacyPage();

      const separators = container.querySelectorAll('[role="none"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });
});
