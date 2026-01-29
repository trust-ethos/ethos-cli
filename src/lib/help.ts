import { Help } from '@oclif/core';
import pc from 'picocolors';
import { loadConfig } from './config/index.js';

const ETHOS_BANNER = `
${pc.cyan('███████╗████████╗██╗  ██╗ ██████╗ ███████╗')}
${pc.cyan('██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔════╝')}
${pc.cyan('█████╗     ██║   ███████║██║   ██║███████╗')}
${pc.cyan('██╔══╝     ██║   ██╔══██║██║   ██║╚════██║')}
${pc.cyan('███████╗   ██║   ██║  ██║╚██████╔╝███████║')}
${pc.cyan('╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝')}
`;

export default class EthosHelp extends Help {
  async showRootHelp(): Promise<void> {
    const config = loadConfig();

    console.log(ETHOS_BANNER);
    console.log(pc.dim('  The reputation layer for the internet\n'));
    console.log(`  ${pc.dim('API:')} ${config.apiUrl}`);
    console.log('');
    
    await super.showRootHelp();
  }
}

