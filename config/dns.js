const dns = require('node:dns');
const { isIP } = require('node:net');

function parseDnsServers(value = '') {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }

  const servers = value.split(',').map((server) => server.trim());
  if (servers.some((server) => !server || !isIP(server))) {
    throw new Error('DNS_SERVERS must be a comma-separated list of IP addresses.');
  }
  return servers;
}

function configureDnsResolver(value = process.env.DNS_SERVERS) {
  const servers = parseDnsServers(value);
  if (servers.length > 0) {
    dns.setServers(servers);
  }
  return servers;
}

module.exports = {
  configureDnsResolver,
  parseDnsServers,
};
