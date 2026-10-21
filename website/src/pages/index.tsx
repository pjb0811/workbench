import { type ReactNode, useState } from 'react';

import { useHistory } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Button, Card, Typography } from '@jbpark/ui-kit';
import Layout from '@theme/Layout';
import {
  BookOpen,
  Check,
  Copy,
  Database,
  ExternalLink,
  Paintbrush,
  SquarePen,
} from 'lucide-react';

import styles from './index.module.css';

const NPM_PACKAGE = '@jbpark/workbench';
const NPM_BADGE_URL = `https://img.shields.io/npm/v/${NPM_PACKAGE}.svg?style=flat-square&color=black&labelColor=eeeeee`;
const GITHUB_URL = 'https://github.com/pjb0811/workbench';
const INSTALL_COMMAND = `pnpm add ${NPM_PACKAGE}`;

const FEATURES = [
  {
    icon: Database,
    title: 'Any Data Source',
    description:
      'Four adapter methods connect a local folder, a REST API or your own store. Directories load one level at a time.',
  },
  {
    icon: SquarePen,
    title: 'Any Editor',
    description:
      'Tabs, unsaved state and saving work through an engine-neutral contract. Use the ui-kit CodeMirror editor or bring your own.',
  },
  {
    icon: Paintbrush,
    title: 'Headless',
    description:
      'No CSS and no class names: every region and state is a data-* attribute, styled with Tailwind, CSS Modules or plain CSS.',
  },
] as const;

function InstallCommand() {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(INSTALL_COMMAND);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label="Copy install command"
      className={styles.installCommand}
    >
      <span>{INSTALL_COMMAND}</span>
      {isCopied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const history = useHistory();
  const docsUrl = useBaseUrl('/docs/intro');

  return (
    <header className={styles.hero}>
      <img src={NPM_BADGE_URL} alt="npm version" className={styles.badge} />
      <Typography.Title level={1}>{siteConfig.title}</Typography.Title>
      <Typography.Paragraph className={styles.subtitle}>
        {siteConfig.tagline}
      </Typography.Paragraph>
      <div className={styles.actions}>
        <InstallCommand />
        <div className={styles.buttonGroup}>
          <Button
            type="primary"
            icon={<BookOpen size={16} />}
            onClick={() => history.push(docsUrl)}
          >
            Get Started
          </Button>
          <Button
            icon={<ExternalLink size={16} />}
            onClick={() => window.open(GITHUB_URL, '_blank')}
          >
            GitHub
          </Button>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <Typography.Title level={2} className={styles.sectionTitle}>
        Why workbench
      </Typography.Title>
      <div className={styles.featureGrid}>
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <div className={styles.featureIcon}>
              <Icon size={20} />
            </div>
            <Typography.Title level={5}>{title}</Typography.Title>
            <Typography.Paragraph className={styles.subtitle}>
              {description}
            </Typography.Paragraph>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main className={styles.main}>
        <HomepageHeader />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
