import { Help } from '@oclif/core';
import pc from 'picocolors';

import { loadConfig } from './config/index.js';
import { ethosGray } from './formatting/colors.js';

const ETHOS_BANNER = `
${ethosGray('███████╗████████╗██╗  ██╗ ██████╗ ███████╗')}
${ethosGray('██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔════╝')}
${ethosGray('█████╗     ██║   ███████║██║   ██║███████╗')}
${ethosGray('██╔══╝     ██║   ██╔══██║██║   ██║╚════██║')}
${ethosGray('███████╗   ██║   ██║  ██║╚██████╔╝███████║')}
${ethosGray('╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝')}
`;

export default class EthosHelp extends Help {
  async showRootHelp(): Promise<void> {
    const config = loadConfig();

    console.log(ETHOS_BANNER);
    console.log(pc.dim('  The reputation layer for the internet\n'));
    const isProd = config.apiUrl === 'https://api.ethos.network';
    const apiColor = isProd ? pc.green : pc.yellow;
    console.log(`  ${pc.dim('API:')} ${apiColor(config.apiUrl)}`);
    console.log('');
    
    await super.showRootHelp();
  }
}

