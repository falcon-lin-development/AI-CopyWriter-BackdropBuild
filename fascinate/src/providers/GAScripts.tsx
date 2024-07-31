import React from 'react';
import Script from 'next/script';
/**
 * 
 * @returns 
 */


const GAScripts: React.FC = () => {
  const GA_ID = process.env.GA_ID;
  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="gtag">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
            gtag('config', '${GA_ID}', {
              'site_name': 'connect.mootiez.com'
            });
        `}
      </Script>
    </>
  );
};

export default GAScripts;
